from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PersonalizedRecommendationsView,
    DynamicPricingInsightsView,
    TravelChatbotView,
    SmartItineraryView,
    ItineraryViewSet,
    GuestPreferenceMatchingView,
    UserPreferenceViewSet,
    track_search,
    track_property_view
)

router = DefaultRouter()
router.register(r'itineraries', ItineraryViewSet, basename='itinerary')
router.register(r'preferences', UserPreferenceViewSet, basename='preference')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Personalized Recommendations
    path('recommendations/', PersonalizedRecommendationsView.as_view(), name='recommendations'),
    
    # Dynamic Pricing Insights
    path('pricing-insights/', DynamicPricingInsightsView.as_view(), name='pricing-insights'),
    path('pricing-insights/<uuid:property_id>/', DynamicPricingInsightsView.as_view(), name='property-pricing-insights'),
    
    # Chatbot
    path('chatbot/', TravelChatbotView.as_view(), name='chatbot'),
    
    # Smart Itinerary
    path('itinerary/generate/', SmartItineraryView.as_view(), name='generate-itinerary'),
    
    # Guest Preference Matching
    path('matches/', GuestPreferenceMatchingView.as_view(), name='guest-matches'),
    
    # Tracking endpoints
    path('track/search/', track_search, name='track-search'),
    path('track/view/', track_property_view, name='track-view'),
]

