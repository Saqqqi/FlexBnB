from django.contrib import admin
from .models import (
    Reservation, 
    HostEarnings, 
    HostMessage, 
    PropertyAnalytics, 
    PropertyReview,
    GuestReview
)


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['id', 'property', 'guest', 'host', 'status', 'check_in_date', 'check_out_date', 'total_price', 'created_at']
    list_filter = ['status', 'created_at', 'check_in_date']
    search_fields = ['property__title', 'guest__email', 'host__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(HostEarnings)
class HostEarningsAdmin(admin.ModelAdmin):
    list_display = ['id', 'host', 'reservation', 'gross_earnings', 'net_earnings', 'payout_status', 'created_at']
    list_filter = ['payout_status', 'created_at']
    search_fields = ['host__email', 'reservation__property__title']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']


@admin.register(HostMessage)
class HostMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'receiver', 'reservation', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['sender__email', 'receiver__email', 'message']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']


@admin.register(PropertyAnalytics)
class PropertyAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['id', 'property', 'views_count', 'booking_requests', 'successful_bookings', 'occupancy_rate', 'total_earnings']
    search_fields = ['property__title']
    readonly_fields = ['id', 'last_updated']
    ordering = ['-last_updated']


@admin.register(PropertyReview)
class PropertyReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'property', 'guest', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['property__title', 'guest__email', 'comment']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']


@admin.register(GuestReview)
class GuestReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'host', 'guest', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['host__email', 'guest__email', 'comment']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at'] 