from django.contrib import admin

from .models import Property, PropertyImage


class PropertyImageInline(admin.TabularInline):
    """Inline admin for property images"""
    model = PropertyImage
    extra = 1
    fields = ('image', 'is_primary', 'order', 'caption')
    ordering = ('order',)


class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'price_per_night', 'country', 'category', 'is_hourly_booking', 'allow_room_pooling')
    list_filter = ('country', 'category', 'is_hourly_booking', 'allow_room_pooling')
    search_fields = ('title', 'description')
    list_per_page = 20
    inlines = [PropertyImageInline]


class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ('property', 'is_primary', 'order', 'created_at')
    list_filter = ('is_primary',)
    search_fields = ('property__title', 'caption')
    ordering = ('property', 'order')


admin.site.register(Property, PropertyAdmin)
admin.site.register(PropertyImage, PropertyImageAdmin)

