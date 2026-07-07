from django.http import JsonResponse

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from useraccount.auth import ClerkAuthentication
from .models import Property, PropertyImage
from .forms import PropertyForm
from .serializers import PropertiesListSerializer, PropertiesDetailSerializer, PropertyImageSerializer

CORS_ALLOWED_ORIGINS = [
    'http://127.0.0.1:3000',  # Frontend origin
]
CORS_ALLOW_CREDENTIALS = True


@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def properties_list(request):
    # Optional filtering by category
    category = request.query_params.get('category')
    properties = Property.objects.all()
    
    if category:
        properties = properties.filter(category__iexact=category)
    
    serializer = PropertiesListSerializer(properties, many=True)
    
    return JsonResponse({
        'data': serializer.data,
    })


@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def properties_detail(request, pk):
    property = Property.objects.get(pk=pk)
    serializer = PropertiesDetailSerializer(property, many=False)
    return JsonResponse(serializer.data)


@api_view(['POST'])
@authentication_classes([ClerkAuthentication])
@permission_classes([IsAuthenticated])
def create_property(request):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required',
            }, status=401)

        form = PropertyForm(request.POST, request.FILES)
        
        if form.is_valid():
            property = form.save(commit=False)
            property.Host = request.user
            property.save()
            
            # Handle multiple images if provided
            images = request.FILES.getlist('images')
            for index, image_file in enumerate(images):
                PropertyImage.objects.create(
                    property=property,
                    image=image_file,
                    is_primary=(index == 0),  # First image is primary
                    order=index
                )

            return JsonResponse({
                'success': True,
                'message': 'Property created successfully',
                'property': {
                    'id': str(property.id),
                    'title': property.title,
                    'description': property.description,
                    'price_per_night': property.price_per_night,
                    'bedrooms': property.bedrooms,
                    'bathrooms': property.bathrooms,
                    'guests': property.guests,
                    'country': property.country,
                    'country_code': property.country_code,
                    'category': property.category,
                    'image_url': property.image_url(),
                    'all_image_urls': property.all_image_urls(),
                    'host': property.Host.id,
                    'created_at': property.created_at,
                }
            }, status=201)
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid form data',
                'errors': form.errors,
            }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e),
        }, status=500)


@api_view(['POST'])
@authentication_classes([ClerkAuthentication])
@permission_classes([IsAuthenticated])
def add_property_images(request, pk):
    """Add additional images to an existing property"""
    try:
        property = Property.objects.get(pk=pk)
        
        # Verify ownership
        if property.Host != request.user:
            return JsonResponse({
                'success': False,
                'message': 'You do not have permission to modify this property',
            }, status=403)
        
        images = request.FILES.getlist('images')
        if not images:
            return JsonResponse({
                'success': False,
                'message': 'No images provided',
            }, status=400)
        
        # Get the current max order
        max_order = property.images.count()
        
        created_images = []
        for index, image_file in enumerate(images):
            img = PropertyImage.objects.create(
                property=property,
                image=image_file,
                is_primary=False,
                order=max_order + index
            )
            created_images.append(PropertyImageSerializer(img).data)
        
        return JsonResponse({
            'success': True,
            'message': f'{len(images)} image(s) added successfully',
            'images': created_images,
        })
    except Property.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Property not found',
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e),
        }, status=500)


@api_view(['DELETE'])
@authentication_classes([ClerkAuthentication])
@permission_classes([IsAuthenticated])
def delete_property_image(request, pk, image_id):
    """Delete an image from a property"""
    try:
        property = Property.objects.get(pk=pk)
        
        # Verify ownership
        if property.Host != request.user:
            return JsonResponse({
                'success': False,
                'message': 'You do not have permission to modify this property',
            }, status=403)
        
        image = PropertyImage.objects.get(pk=image_id, property=property)
        was_primary = image.is_primary
        image.delete()
        
        # If deleted image was primary, set the first remaining image as primary
        if was_primary:
            first_image = property.images.first()
            if first_image:
                first_image.is_primary = True
                first_image.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Image deleted successfully',
        })
    except Property.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Property not found',
        }, status=404)
    except PropertyImage.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Image not found',
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e),
        }, status=500)


@api_view(['PATCH'])
@authentication_classes([ClerkAuthentication])
@permission_classes([IsAuthenticated])
def set_primary_image(request, pk, image_id):
    """Set an image as the primary image for a property"""
    try:
        property = Property.objects.get(pk=pk)
        
        # Verify ownership
        if property.Host != request.user:
            return JsonResponse({
                'success': False,
                'message': 'You do not have permission to modify this property',
            }, status=403)
        
        image = PropertyImage.objects.get(pk=image_id, property=property)
        image.is_primary = True
        image.save()  # The model's save method will unset other primary images
        
        return JsonResponse({
            'success': True,
            'message': 'Primary image updated successfully',
        })
    except Property.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Property not found',
        }, status=404)
    except PropertyImage.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Image not found',
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e),
        }, status=500)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def property_images(request, pk):
    """Get all images for a property"""
    try:
        property = Property.objects.get(pk=pk)
        images = property.images.all()
        serializer = PropertyImageSerializer(images, many=True)
        
        return JsonResponse({
            'success': True,
            'images': serializer.data,
        })
    except Property.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Property not found',
        }, status=404)