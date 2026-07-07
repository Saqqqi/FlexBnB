from rest_framework import serializers
from .models import (
    UserPreference, SearchHistory, PropertyView, PriceTrend,
    LocationPriceIndex, Itinerary, ChatbotConversation, GuestMatch
)
from property.serializers import PropertiesListSerializer as PropertyListSerializer


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = [
            'id', 'preferred_categories', 'preferred_countries',
            'min_bedrooms', 'max_price_per_night', 'budget_preference',
            'travel_style', 'preferred_amenities', 'typical_group_size',
            'prefers_pet_friendly', 'prefers_accessibility',
            'price_drop_alerts', 'new_listing_alerts',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = [
            'id', 'search_query', 'location', 'category',
            'check_in_date', 'check_out_date', 'guests_count',
            'min_price', 'max_price', 'results_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PropertyViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyView
        fields = [
            'id', 'property', 'view_duration', 'viewed_images',
            'viewed_reviews', 'added_to_wishlist', 'initiated_booking',
            'completed_booking', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PriceTrendSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceTrend
        fields = [
            'id', 'property', 'date', 'base_price', 'actual_price',
            'is_weekend', 'is_holiday', 'is_peak_season', 'local_event',
            'demand_score', 'booking_rate'
        ]


class LocationPriceIndexSerializer(serializers.ModelSerializer):
    monthly_indices = serializers.SerializerMethodField()
    
    class Meta:
        model = LocationPriceIndex
        fields = [
            'id', 'country', 'city', 'monthly_indices',
            'cheapest_month', 'most_expensive_month',
            'recommended_booking_advance', 'last_updated'
        ]
    
    def get_monthly_indices(self, obj):
        return {
            'January': obj.january_index,
            'February': obj.february_index,
            'March': obj.march_index,
            'April': obj.april_index,
            'May': obj.may_index,
            'June': obj.june_index,
            'July': obj.july_index,
            'August': obj.august_index,
            'September': obj.september_index,
            'October': obj.october_index,
            'November': obj.november_index,
            'December': obj.december_index,
        }


class ItinerarySerializer(serializers.ModelSerializer):
    property_details = PropertyListSerializer(source='property', read_only=True)
    duration_days = serializers.SerializerMethodField()
    
    class Meta:
        model = Itinerary
        fields = [
            'id', 'title', 'destination', 'start_date', 'end_date',
            'duration_days', 'property', 'property_details', 'reservation',
            'activities', 'restaurants', 'attractions', 'transportation',
            'notes', 'ai_suggestions', 'weather_forecast',
            'is_public', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'ai_suggestions', 'weather_forecast', 'created_at', 'updated_at']
    
    def get_duration_days(self, obj):
        if obj.start_date and obj.end_date:
            return (obj.end_date - obj.start_date).days + 1
        return 0


class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000)
    session_id = serializers.CharField(max_length=255, required=False)


class ChatResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
    intent = serializers.CharField()
    suggestions = serializers.ListField(child=serializers.DictField(), required=False)
    properties = serializers.ListField(required=False)
    actions = serializers.ListField(child=serializers.DictField(), required=False)


class GuestMatchSerializer(serializers.ModelSerializer):
    property_details = PropertyListSerializer(source='property', read_only=True)
    
    class Meta:
        model = GuestMatch
        fields = [
            'id', 'property', 'property_details', 'overall_match_score',
            'category_match', 'price_match', 'location_match',
            'amenities_match', 'style_match', 'match_reasons',
            'is_viewed', 'is_dismissed', 'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'overall_match_score', 'match_reasons', 'created_at', 'expires_at']


class RecommendationResponseSerializer(serializers.Serializer):
    """Serializer for recommendation API responses"""
    recommended_properties = serializers.ListField()
    recommendation_type = serializers.CharField()
    personalization_score = serializers.FloatField()
    reasons = serializers.ListField(child=serializers.CharField())


class PricingInsightSerializer(serializers.Serializer):
    """Serializer for pricing insights"""
    property_id = serializers.UUIDField()
    current_price = serializers.IntegerField()
    average_price = serializers.FloatField()
    price_trend = serializers.CharField()  # 'rising', 'falling', 'stable'
    best_time_to_book = serializers.CharField()
    potential_savings = serializers.IntegerField()
    price_forecast = serializers.ListField(child=serializers.DictField())
    demand_level = serializers.CharField()  # 'low', 'medium', 'high', 'very_high'
    booking_recommendation = serializers.CharField()

