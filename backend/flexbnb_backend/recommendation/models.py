import uuid
from django.db import models
from django.utils import timezone
from useraccount.models import User
from property.models import Property


class UserPreference(models.Model):
    """Stores user preferences for personalized recommendations"""
    
    BUDGET_CHOICES = [
        ('budget', 'Budget-Friendly'),
        ('moderate', 'Moderate'),
        ('luxury', 'Luxury'),
        ('any', 'Any'),
    ]
    
    TRAVEL_STYLE_CHOICES = [
        ('adventure', 'Adventure'),
        ('relaxation', 'Relaxation'),
        ('business', 'Business'),
        ('family', 'Family'),
        ('romantic', 'Romantic'),
        ('solo', 'Solo'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, related_name='preference', on_delete=models.CASCADE)
    
    # Property preferences
    preferred_categories = models.JSONField(default=list)  # ['Beach', 'Mountain', 'City']
    preferred_countries = models.JSONField(default=list)
    min_bedrooms = models.IntegerField(default=1)
    max_price_per_night = models.IntegerField(null=True, blank=True)
    
    # Travel preferences
    budget_preference = models.CharField(max_length=20, choices=BUDGET_CHOICES, default='any')
    travel_style = models.CharField(max_length=20, choices=TRAVEL_STYLE_CHOICES, default='relaxation')
    preferred_amenities = models.JSONField(default=list)  # ['WiFi', 'Pool', 'Kitchen']
    
    # Guest preferences
    typical_group_size = models.IntegerField(default=2)
    prefers_pet_friendly = models.BooleanField(default=False)
    prefers_accessibility = models.BooleanField(default=False)
    
    # Notification preferences
    price_drop_alerts = models.BooleanField(default=True)
    new_listing_alerts = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Preferences for {self.user.email}"


class SearchHistory(models.Model):
    """Tracks user search patterns for better recommendations"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='search_history', on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=255, null=True, blank=True)  # For anonymous users
    
    # Search parameters
    search_query = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=100, blank=True)
    check_in_date = models.DateField(null=True, blank=True)
    check_out_date = models.DateField(null=True, blank=True)
    guests_count = models.IntegerField(default=1)
    min_price = models.IntegerField(null=True, blank=True)
    max_price = models.IntegerField(null=True, blank=True)
    
    # Metadata
    results_count = models.IntegerField(default=0)
    clicked_property = models.ForeignKey(Property, null=True, blank=True, on_delete=models.SET_NULL)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']


class PropertyView(models.Model):
    """Tracks property views for collaborative filtering"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='property_views', on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=255, null=True, blank=True)
    property = models.ForeignKey(Property, related_name='user_views', on_delete=models.CASCADE)
    
    # View details
    view_duration = models.IntegerField(default=0)  # seconds
    viewed_images = models.BooleanField(default=False)
    viewed_reviews = models.BooleanField(default=False)
    added_to_wishlist = models.BooleanField(default=False)
    initiated_booking = models.BooleanField(default=False)
    completed_booking = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']


class PriceTrend(models.Model):
    """Historical price data for dynamic pricing insights"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, related_name='price_trends', on_delete=models.CASCADE)
    
    date = models.DateField()
    base_price = models.IntegerField()  # Normal price
    actual_price = models.IntegerField()  # Price that day (could be higher/lower)
    
    # Factors affecting price
    is_weekend = models.BooleanField(default=False)
    is_holiday = models.BooleanField(default=False)
    is_peak_season = models.BooleanField(default=False)
    local_event = models.CharField(max_length=255, blank=True)
    
    # Demand metrics
    demand_score = models.FloatField(default=1.0)  # 1.0 = normal, >1 = high demand
    booking_rate = models.FloatField(default=0.0)  # % of similar properties booked
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = ['property', 'date']


class LocationPriceIndex(models.Model):
    """Price index for different locations to track best booking times"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    country = models.CharField(max_length=255)
    city = models.CharField(max_length=255, blank=True)
    
    # Monthly price indices (1.0 = average, <1 = cheaper, >1 = expensive)
    january_index = models.FloatField(default=1.0)
    february_index = models.FloatField(default=1.0)
    march_index = models.FloatField(default=1.0)
    april_index = models.FloatField(default=1.0)
    may_index = models.FloatField(default=1.0)
    june_index = models.FloatField(default=1.0)
    july_index = models.FloatField(default=1.0)
    august_index = models.FloatField(default=1.0)
    september_index = models.FloatField(default=1.0)
    october_index = models.FloatField(default=1.0)
    november_index = models.FloatField(default=1.0)
    december_index = models.FloatField(default=1.0)
    
    # Best time to book
    cheapest_month = models.CharField(max_length=20, blank=True)
    most_expensive_month = models.CharField(max_length=20, blank=True)
    recommended_booking_advance = models.IntegerField(default=30)  # days
    
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['country', 'city']


class Itinerary(models.Model):
    """Smart itinerary planning for trips"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='itineraries', on_delete=models.CASCADE)
    
    # Trip details
    title = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Associated properties
    property = models.ForeignKey(Property, related_name='itineraries', on_delete=models.SET_NULL, null=True, blank=True)
    reservation = models.ForeignKey('booking.Reservation', related_name='itineraries', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Itinerary content (JSON structure)
    activities = models.JSONField(default=list)  # [{day: 1, time: "09:00", activity: "...", location: "..."}]
    restaurants = models.JSONField(default=list)
    attractions = models.JSONField(default=list)
    transportation = models.JSONField(default=list)
    notes = models.TextField(blank=True)
    
    # AI-generated suggestions
    ai_suggestions = models.JSONField(default=list)
    weather_forecast = models.JSONField(default=dict)
    
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} - {self.destination}"
    
    class Meta:
        ordering = ['-created_at']


class ChatbotConversation(models.Model):
    """Stores chatbot conversations for context and improvement"""
    
    MESSAGE_TYPE_CHOICES = [
        ('user', 'User'),
        ('bot', 'Bot'),
        ('system', 'System'),
    ]
    
    INTENT_CHOICES = [
        ('greeting', 'Greeting'),
        ('search_property', 'Search Property'),
        ('booking_help', 'Booking Help'),
        ('price_inquiry', 'Price Inquiry'),
        ('recommendation', 'Recommendation'),
        ('itinerary', 'Itinerary Planning'),
        ('support', 'Support'),
        ('general', 'General'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='chatbot_conversations', on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=255)
    
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES)
    message = models.TextField()
    intent = models.CharField(max_length=30, choices=INTENT_CHOICES, default='general')
    
    # Context for better responses
    extracted_entities = models.JSONField(default=dict)  # {location: "Paris", dates: [...]}
    suggested_properties = models.JSONField(default=list)  # List of property IDs
    
    # Feedback
    was_helpful = models.BooleanField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']


class GuestMatch(models.Model):
    """Matches guests with best suited properties based on preferences"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='property_matches', on_delete=models.CASCADE)
    property = models.ForeignKey(Property, related_name='guest_matches', on_delete=models.CASCADE)
    
    # Match scores (0-100)
    overall_match_score = models.FloatField(default=0)
    category_match = models.FloatField(default=0)
    price_match = models.FloatField(default=0)
    location_match = models.FloatField(default=0)
    amenities_match = models.FloatField(default=0)
    style_match = models.FloatField(default=0)
    
    # Reasons for recommendation
    match_reasons = models.JSONField(default=list)  # ["Perfect for families", "In your budget", ...]
    
    # Status
    is_viewed = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # Recommendations expire after some time
    
    class Meta:
        ordering = ['-overall_match_score']
        unique_together = ['user', 'property']

