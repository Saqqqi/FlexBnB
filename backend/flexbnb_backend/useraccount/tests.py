from django.test import TestCase

from .models import User
from .serializers import UserDetailSerializer


class UserDetailSerializerTest(TestCase):
    """
    Ensure UserDetailSerializer can serialize a real User without errors.
    This catches field mismatches between the serializer and the custom User model.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            name='Test User',
            email='test@example.com',
            password='testpassword123',
        )

    def test_serializer_contains_expected_fields(self):
        serializer = UserDetailSerializer(self.user)
        data = serializer.data
        self.assertEqual(set(data.keys()), {'id', 'name', 'email', 'avatar_url'})

    def test_serializer_email_matches(self):
        serializer = UserDetailSerializer(self.user)
        self.assertEqual(serializer.data['email'], 'test@example.com')

    def test_serializer_name_matches(self):
        serializer = UserDetailSerializer(self.user)
        self.assertEqual(serializer.data['name'], 'Test User')

    def test_serializer_avatar_url_is_string(self):
        serializer = UserDetailSerializer(self.user)
        # No avatar uploaded — should return empty string, not raise AttributeError
        self.assertIsInstance(serializer.data['avatar_url'], str)

    def test_serializer_does_not_expose_password(self):
        serializer = UserDetailSerializer(self.user)
        self.assertNotIn('password', serializer.data)


class SimpleJWTSettingsTest(TestCase):
    """
    Ensure SIMPLE_JWT settings are correctly configured.
    Guards against typos in key names that cause settings to be silently ignored.
    """

    def test_algorithm_key_is_present(self):
        from django.conf import settings
        self.assertIn(
            'ALGORITHM', settings.SIMPLE_JWT,
            "SIMPLE_JWT must contain 'ALGORITHM' (not 'ALOGRIGTHM' or any other typo)"
        )

    def test_algorithm_is_hs512(self):
        from django.conf import settings
        self.assertEqual(
            settings.SIMPLE_JWT['ALGORITHM'],
            'HS512',
            "SIMPLE_JWT['ALGORITHM'] must be 'HS512' for locally-issued tokens"
        )

    def test_no_typo_key_present(self):
        from django.conf import settings
        self.assertNotIn(
            'ALOGRIGTHM', settings.SIMPLE_JWT,
            "Typo key 'ALOGRIGTHM' must not be present in SIMPLE_JWT"
        )

    def test_signing_key_is_configured(self):
        from django.conf import settings
        self.assertIn(
            'SIGNING_KEY', settings.SIMPLE_JWT,
            "SIMPLE_JWT must contain 'SIGNING_KEY'"
        )
