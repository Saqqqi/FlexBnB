import uuid

from django.conf import settings
from django.db import models

from useraccount.models import User


class Property(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    price_per_night = models.IntegerField()
    price_per_hour = models.IntegerField(null=True, blank=True)
    is_hourly_booking = models.BooleanField(default=False)
    available_hours_start = models.TimeField(null=True, blank=True)
    available_hours_end = models.TimeField(null=True, blank=True)
    bedrooms = models.IntegerField()
    bathrooms = models.IntegerField()
    guests = models.IntegerField()
    country = models.CharField(max_length=255)
    country_code = models.CharField(max_length=10)
    category = models.CharField(max_length=255)
    # Keep legacy single image field for backwards compatibility
    image = models.ImageField(upload_to='uploads/properties')
    Host = models.ForeignKey(User, related_name='properties', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Room Pooling Settings
    allow_room_pooling = models.BooleanField(default=False)
    max_pool_members = models.IntegerField(default=6, null=True, blank=True)
    
    def image_url(self):
        """Returns primary image URL or legacy image URL"""
        primary_image = self.images.filter(is_primary=True).first()
        if primary_image:
            return f'{settings.WEBSITE_URL}{primary_image.image.url}'
        return f'{settings.WEBSITE_URL}{self.image.url}'
    
    def all_image_urls(self):
        """Returns all image URLs for this property"""
        urls = [f'{settings.WEBSITE_URL}{img.image.url}' for img in self.images.all().order_by('order')]
        # If no additional images, return the legacy image
        if not urls and self.image:
            urls = [f'{settings.WEBSITE_URL}{self.image.url}']
        return urls
    
    def __str__(self):
        return self.title


class PropertyImage(models.Model):
    """Model for storing multiple images per property"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, 
        related_name='images', 
        on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to='uploads/properties')
    is_primary = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    caption = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = 'Property Image'
        verbose_name_plural = 'Property Images'
    
    def image_url(self):
        return f'{settings.WEBSITE_URL}{self.image.url}'
    
    def save(self, *args, **kwargs):
        # If this is set as primary, unset other primary images for this property
        if self.is_primary:
            PropertyImage.objects.filter(
                property=self.property, 
                is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Image for {self.property.title} (Order: {self.order})"


