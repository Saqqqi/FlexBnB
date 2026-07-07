from rest_framework import serializers

from .models import Property, PropertyImage

from useraccount.serializers import UserDetailSerializer


class PropertyImageSerializer(serializers.ModelSerializer):
    """Serializer for property images"""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyImage
        fields = (
            'id',
            'image_url',
            'is_primary',
            'order',
            'caption',
            'created_at',
        )
    
    def get_image_url(self, obj):
        return obj.image_url()


class PropertiesListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = (
            'id',
            'title',
            'price_per_night',
            'price_per_hour',
            'is_hourly_booking',
            'image_url',
            'allow_room_pooling',
        )


class PropertiesDetailSerializer(serializers.ModelSerializer):
    host = UserDetailSerializer(read_only=True, many=False)
    images = PropertyImageSerializer(many=True, read_only=True)
    all_image_urls = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = (
            'id',
            'title',
            'description',
            'price_per_night',
            'price_per_hour',
            'is_hourly_booking',
            'available_hours_start',
            'available_hours_end',
            'image_url',
            'all_image_urls',
            'images',
            'bedrooms',
            'bathrooms',
            'guests',
            'country',
            'country_code',
            'category',
            'host',
            'allow_room_pooling',
            'max_pool_members',
        )
    
    def get_all_image_urls(self, obj):
        return obj.all_image_urls()
