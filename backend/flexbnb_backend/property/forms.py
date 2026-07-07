from django.forms import ModelForm

from .models import Property


class PropertyForm(ModelForm):
    class Meta:
        model = Property
        fields = (
            'title',
            'description',
            'price_per_night',
            'price_per_hour',
            'is_hourly_booking',
            'available_hours_start',
            'available_hours_end',
            'bedrooms',
            'bathrooms',
            'guests',
            'country',
            'country_code',
            'category',
            'image',
            'allow_room_pooling',
            'max_pool_members',
        )