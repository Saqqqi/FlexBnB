from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from django.conf import settings
import jwt
import requests
import os

User = get_user_model()

class ClerkAuthentication(BaseAuthentication):
    def authenticate(self, request):
        # Get the auth header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        
        try:
            # Get Clerk's JWKS (JSON Web Key Set)
            clerk_issuer = settings.CLERK_ISSUER
            jwks_url = f"{clerk_issuer}/.well-known/jwks.json"
            
            # Decode the token header to get the key ID (kid)
            header = jwt.get_unverified_header(token)
            kid = header.get('kid')
            
            if not kid:
                raise AuthenticationFailed('Invalid token: no key ID')
            
            # Get the public key from Clerk
            response = requests.get(jwks_url)
            if response.status_code != 200:
                raise AuthenticationFailed('Failed to fetch public key')
            
            jwks = response.json()
            public_key = None
            
            # Find the correct public key
            for key in jwks.get('keys', []):
                if key.get('kid') == kid:
                    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                    break
            
            if not public_key:
                raise AuthenticationFailed('Public key not found')
            
            # First decode without verification to inspect claims
            unverified_payload = jwt.decode(token, options={'verify_signature': False})
            
            # Verify and decode the token
            try:
                decoded = jwt.decode(
                    token,
                    public_key,
                    algorithms=['RS256'],
                    issuer=clerk_issuer,
                    options={
                        'verify_exp': True,
                        'verify_iss': True,
                        'verify_aud': False  # Accept default Clerk session tokens without custom audience
                    }
                )
            except jwt.InvalidTokenError as e:
                print(f"Token verification failed: {str(e)}")
                print(f"Token payload: {unverified_payload}")
                raise
            
            # Get user information from the token
            user_id = decoded.get('sub') or decoded.get('userId')
            if not user_id:
                raise AuthenticationFailed('Invalid token: no user ID')
            
            email = decoded.get('email') or ''
            name = decoded.get('name') or ''
            
            # Get or create user
            user, created = User.objects.get_or_create(
                clerk_id=user_id,
                defaults={
                    'email': email or f"user-{user_id}@example.com",
                    'name': name or '',
                    'is_active': True
                }
            )
            
            # Update user info if claims present and changed
            updated = False
            if email and user.email != email:
                user.email = email
                updated = True
            if name and user.name != name:
                user.name = name
                updated = True
            if updated:
                user.save()
            
            return (user, None)
            
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f'Invalid token: {str(e)}')
        except Exception as e:
            print(f"Authentication error: {str(e)}")
            raise AuthenticationFailed(f'Authentication failed: {str(e)}') 