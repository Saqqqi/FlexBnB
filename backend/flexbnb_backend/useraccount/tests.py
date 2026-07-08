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
