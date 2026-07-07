from django.contrib import admin
from .models import (
    UserPreference, SearchHistory, PropertyView, PriceTrend,
    LocationPriceIndex, Itinerary, ChatbotConversation, GuestMatch
)


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'budget_preference', 'travel_style', 'typical_group_size', 'updated_at']
    list_filter = ['budget_preference', 'travel_style']
    search_fields = ['user__email', 'user__name']


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'location', 'category', 'guests_count', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['user__email', 'location', 'search_query']
    date_hierarchy = 'created_at'


@admin.register(PropertyView)
class PropertyViewAdmin(admin.ModelAdmin):
    list_display = ['user', 'property', 'view_duration', 'initiated_booking', 'completed_booking', 'created_at']
    list_filter = ['initiated_booking', 'completed_booking', 'created_at']
    search_fields = ['user__email', 'property__title']


@admin.register(PriceTrend)
class PriceTrendAdmin(admin.ModelAdmin):
    list_display = ['property', 'date', 'base_price', 'actual_price', 'demand_score']
    list_filter = ['is_weekend', 'is_holiday', 'is_peak_season']
    search_fields = ['property__title']
    date_hierarchy = 'date'


@admin.register(LocationPriceIndex)
class LocationPriceIndexAdmin(admin.ModelAdmin):
    list_display = ['country', 'city', 'cheapest_month', 'most_expensive_month', 'last_updated']
    list_filter = ['country']
    search_fields = ['country', 'city']


@admin.register(Itinerary)
class ItineraryAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'destination', 'start_date', 'end_date', 'is_public', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['title', 'destination', 'user__email']
    date_hierarchy = 'start_date'


@admin.register(ChatbotConversation)
class ChatbotConversationAdmin(admin.ModelAdmin):
    list_display = ['user', 'session_id', 'message_type', 'intent', 'was_helpful', 'created_at']
    list_filter = ['message_type', 'intent', 'was_helpful']
    search_fields = ['user__email', 'message', 'session_id']
    date_hierarchy = 'created_at'


@admin.register(GuestMatch)
class GuestMatchAdmin(admin.ModelAdmin):
    list_display = ['user', 'property', 'overall_match_score', 'is_viewed', 'is_dismissed', 'created_at']
    list_filter = ['is_viewed', 'is_dismissed']
    search_fields = ['user__email', 'property__title']
    ordering = ['-overall_match_score']

