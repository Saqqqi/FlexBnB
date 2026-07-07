import uuid
import random
from datetime import datetime, timedelta
from decimal import Decimal
from collections import defaultdict

from django.db.models import Avg, Count, Q, F
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.views import APIView

from property.models import Property
from booking.models import Reservation, PropertyReview
from useraccount.models import User
from useraccount.auth import ClerkAuthentication

from .models import (
    UserPreference, SearchHistory, PropertyView, PriceTrend,
    LocationPriceIndex, Itinerary, ChatbotConversation, GuestMatch
)
from .serializers import (
    UserPreferenceSerializer, SearchHistorySerializer, PropertyViewSerializer,
    ItinerarySerializer, ChatMessageSerializer, GuestMatchSerializer,
    PricingInsightSerializer, LocationPriceIndexSerializer
)
from property.serializers import PropertiesListSerializer as PropertyListSerializer


# ============================================================================
# 1. PERSONALIZED STAY SUGGESTIONS BASED ON USER BEHAVIOR
# ============================================================================

class PersonalizedRecommendationsView(APIView):
    """
    AI-powered personalized property recommendations based on:
    - User search history
    - Property views and interactions
    - Booking patterns
    - Explicit preferences
    - Similar user behavior (collaborative filtering)
    """
    authentication_classes = [ClerkAuthentication]
    
    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        session_id = request.query_params.get('session_id', '')
        limit = int(request.query_params.get('limit', 10))
        
        recommendations = []
        recommendation_reasons = []
        
        if user:
            # Get user preferences
            preference = UserPreference.objects.filter(user=user).first()
            
            # 1. Content-based filtering: Based on user preferences
            if preference:
                content_based = self._get_content_based_recommendations(user, preference, limit=5)
                recommendations.extend(content_based['properties'])
                recommendation_reasons.extend(content_based['reasons'])
            
            # 2. Collaborative filtering: Based on similar users
            collaborative = self._get_collaborative_recommendations(user, limit=5)
            recommendations.extend(collaborative['properties'])
            recommendation_reasons.extend(collaborative['reasons'])
            
            # 3. History-based: Based on search and view history
            history_based = self._get_history_based_recommendations(user, limit=5)
            recommendations.extend(history_based['properties'])
            recommendation_reasons.extend(history_based['reasons'])
        else:
            # Anonymous user: Show trending and popular properties
            trending = self._get_trending_properties(session_id, limit)
            recommendations.extend(trending['properties'])
            recommendation_reasons.extend(trending['reasons'])
        
        # Remove duplicates while preserving order
        seen = set()
        unique_recommendations = []
        for prop in recommendations:
            if prop['id'] not in seen:
                seen.add(prop['id'])
                unique_recommendations.append(prop)
        
        # Score and sort recommendations
        scored_recommendations = self._score_recommendations(unique_recommendations, user)
        
        return Response({
            'recommendations': scored_recommendations[:limit],
            'recommendation_type': 'personalized' if user else 'trending',
            'total_count': len(scored_recommendations),
            'reasons': list(set(recommendation_reasons))[:5],
            'personalization_score': self._calculate_personalization_score(user)
        })
    
    def _get_content_based_recommendations(self, user, preference, limit=5):
        """Recommend properties matching user preferences"""
        properties = Property.objects.all()
        reasons = []
        
        # Filter by preferred categories
        if preference.preferred_categories:
            properties = properties.filter(category__in=preference.preferred_categories)
            reasons.append(f"Matches your preferred categories")
        
        # Filter by preferred countries
        if preference.preferred_countries:
            properties = properties.filter(country__in=preference.preferred_countries)
            reasons.append(f"In your favorite destinations")
        
        # Filter by price
        if preference.max_price_per_night:
            properties = properties.filter(price_per_night__lte=preference.max_price_per_night)
            reasons.append("Within your budget")
        
        # Filter by bedrooms
        if preference.min_bedrooms:
            properties = properties.filter(bedrooms__gte=preference.min_bedrooms)
        
        # Filter by guest capacity
        if preference.typical_group_size:
            properties = properties.filter(guests__gte=preference.typical_group_size)
        
        # Get top-rated properties
        properties = properties.annotate(
            avg_rating=Avg('reviews__rating')
        ).order_by('-avg_rating')[:limit]
        
        serializer = PropertyListSerializer(properties, many=True)
        return {'properties': serializer.data, 'reasons': reasons}
    
    def _get_collaborative_recommendations(self, user, limit=5):
        """Find properties liked by similar users"""
        reasons = []
        
        # Find users with similar booking patterns
        user_bookings = Reservation.objects.filter(guest=user).values_list('property_id', flat=True)
        
        if not user_bookings:
            return {'properties': [], 'reasons': []}
        
        # Find users who booked the same properties
        similar_users = Reservation.objects.filter(
            property_id__in=user_bookings
        ).exclude(guest=user).values_list('guest_id', flat=True).distinct()[:20]
        
        # Get properties those users also booked
        recommended_property_ids = Reservation.objects.filter(
            guest_id__in=similar_users
        ).exclude(
            property_id__in=user_bookings
        ).values_list('property_id', flat=True).distinct()[:limit]
        
        properties = Property.objects.filter(id__in=recommended_property_ids)
        
        if properties.exists():
            reasons.append("Popular among travelers like you")
        
        serializer = PropertyListSerializer(properties, many=True)
        return {'properties': serializer.data, 'reasons': reasons}
    
    def _get_history_based_recommendations(self, user, limit=5):
        """Recommend based on search and view history"""
        reasons = []
        
        # Get recent searches
        recent_searches = SearchHistory.objects.filter(user=user).order_by('-created_at')[:10]
        
        # Extract common patterns
        locations = [s.location for s in recent_searches if s.location]
        categories = [s.category for s in recent_searches if s.category]
        
        properties = Property.objects.all()
        
        if locations:
            most_searched_location = max(set(locations), key=locations.count)
            properties = properties.filter(country__icontains=most_searched_location)
            reasons.append(f"Based on your searches in {most_searched_location}")
        
        if categories:
            most_searched_category = max(set(categories), key=categories.count)
            properties = properties.filter(category=most_searched_category)
            reasons.append(f"Based on your interest in {most_searched_category}")
        
        # Get recently viewed but not booked
        viewed_property_ids = PropertyView.objects.filter(
            user=user, completed_booking=False
        ).values_list('property_id', flat=True)[:limit]
        
        if viewed_property_ids:
            reasons.append("Properties you viewed but haven't booked")
        
        properties = properties[:limit]
        serializer = PropertyListSerializer(properties, many=True)
        return {'properties': serializer.data, 'reasons': reasons}
    
    def _get_trending_properties(self, session_id, limit=10):
        """Get trending properties for anonymous users"""
        # Properties with most views/bookings in last 7 days
        week_ago = timezone.now() - timedelta(days=7)
        
        trending = Property.objects.annotate(
            recent_views=Count('user_views', filter=Q(user_views__created_at__gte=week_ago)),
            recent_bookings=Count('reservations', filter=Q(reservations__created_at__gte=week_ago)),
            avg_rating=Avg('reviews__rating')
        ).order_by('-recent_bookings', '-recent_views', '-avg_rating')[:limit]
        
        serializer = PropertyListSerializer(trending, many=True)
        return {
            'properties': serializer.data,
            'reasons': ['Trending this week', 'Popular among travelers']
        }
    
    def _score_recommendations(self, recommendations, user):
        """Score and rank recommendations"""
        for i, rec in enumerate(recommendations):
            base_score = 100 - (i * 5)  # Position-based score
            
            # Boost for high ratings
            if 'average_rating' in rec:
                base_score += float(rec.get('average_rating', 0)) * 10
            
            rec['recommendation_score'] = min(100, base_score)
        
        return sorted(recommendations, key=lambda x: x.get('recommendation_score', 0), reverse=True)
    
    def _calculate_personalization_score(self, user):
        """Calculate how personalized the recommendations are (0-100)"""
        if not user:
            return 0
        
        score = 0
        
        # Check if user has preferences
        if UserPreference.objects.filter(user=user).exists():
            score += 30
        
        # Check search history
        search_count = SearchHistory.objects.filter(user=user).count()
        score += min(20, search_count * 2)
        
        # Check property views
        view_count = PropertyView.objects.filter(user=user).count()
        score += min(25, view_count * 2.5)
        
        # Check booking history
        booking_count = Reservation.objects.filter(guest=user).count()
        score += min(25, booking_count * 5)
        
        return min(100, score)


# ============================================================================
# 2. DYNAMIC PRICING INSIGHTS - BEST TIME TO BOOK
# ============================================================================

class DynamicPricingInsightsView(APIView):
    """
    Provides pricing insights including:
    - Historical price trends
    - Best time to book
    - Price predictions
    - Demand forecasting
    
    This endpoint is publicly accessible (no authentication required)
    as pricing insights help all users make informed booking decisions.
    """
    authentication_classes = []  # Allow unauthenticated access
    permission_classes = []      # No permissions required
    
    def get(self, request, property_id=None):
        # Get specific property or location-based insights
        if property_id:
            return self._get_property_pricing_insights(property_id, request)
        else:
            location = request.query_params.get('location', '')
            return self._get_location_pricing_insights(location, request)
    
    def _get_property_pricing_insights(self, property_id, request):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({'error': 'Property not found'}, status=404)
        
        check_in = request.query_params.get('check_in')
        check_out = request.query_params.get('check_out')
        
        current_price = property_obj.price_per_night
        
        # Calculate price analysis
        price_analysis = self._analyze_property_price(property_obj, check_in, check_out)
        
        # Generate price forecast
        forecast = self._generate_price_forecast(property_obj)
        
        # Determine demand level
        demand = self._calculate_demand_level(property_obj)
        
        # Generate booking recommendation
        recommendation = self._generate_booking_recommendation(
            price_analysis, demand, check_in
        )
        
        return Response({
            'property_id': str(property_id),
            'property_title': property_obj.title,
            'current_price': current_price,
            'average_price': price_analysis['average'],
            'min_price_30_days': price_analysis['min'],
            'max_price_30_days': price_analysis['max'],
            'price_trend': price_analysis['trend'],
            'trend_percentage': price_analysis['trend_percentage'],
            'best_time_to_book': price_analysis['best_time'],
            'potential_savings': price_analysis['potential_savings'],
            'price_forecast': forecast,
            'demand_level': demand['level'],
            'demand_score': demand['score'],
            'similar_properties_booked': demand['similar_booked'],
            'booking_recommendation': recommendation,
            'price_factors': self._get_price_factors(check_in, property_obj.country)
        })
    
    def _analyze_property_price(self, property_obj, check_in=None, check_out=None):
        """Analyze price trends for a property"""
        base_price = property_obj.price_per_night
        
        # Simulate price variations based on various factors
        # In production, this would use historical data from PriceTrend model
        
        today = datetime.now().date()
        month = today.month
        
        # Seasonal factors
        seasonal_multipliers = {
            1: 0.85,   # January - low
            2: 0.9,    # February
            3: 0.95,   # March
            4: 1.0,    # April
            5: 1.1,    # May
            6: 1.25,   # June - high
            7: 1.3,    # July - peak
            8: 1.3,    # August - peak
            9: 1.1,    # September
            10: 1.0,   # October
            11: 0.9,   # November
            12: 1.15,  # December - holidays
        }
        
        current_multiplier = seasonal_multipliers.get(month, 1.0)
        
        # Calculate price range for next 30 days
        prices = []
        for i in range(30):
            future_date = today + timedelta(days=i)
            day_of_week = future_date.weekday()
            future_month = future_date.month
            
            multiplier = seasonal_multipliers.get(future_month, 1.0)
            
            # Weekend premium
            if day_of_week >= 5:  # Saturday, Sunday
                multiplier *= 1.15
            
            prices.append(int(base_price * multiplier))
        
        avg_price = sum(prices) / len(prices)
        min_price = min(prices)
        max_price = max(prices)
        
        # Determine trend
        first_half_avg = sum(prices[:15]) / 15
        second_half_avg = sum(prices[15:]) / 15
        
        if second_half_avg > first_half_avg * 1.05:
            trend = 'rising'
            trend_percentage = ((second_half_avg - first_half_avg) / first_half_avg) * 100
        elif second_half_avg < first_half_avg * 0.95:
            trend = 'falling'
            trend_percentage = ((first_half_avg - second_half_avg) / first_half_avg) * -100
        else:
            trend = 'stable'
            trend_percentage = 0
        
        # Find best time to book
        cheapest_month = min(seasonal_multipliers, key=seasonal_multipliers.get)
        month_names = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December']
        best_time = month_names[cheapest_month]
        
        potential_savings = max_price - min_price
        
        return {
            'average': round(avg_price, 2),
            'min': min_price,
            'max': max_price,
            'trend': trend,
            'trend_percentage': round(trend_percentage, 1),
            'best_time': best_time,
            'potential_savings': potential_savings
        }
    
    def _generate_price_forecast(self, property_obj):
        """Generate 7-day price forecast"""
        base_price = property_obj.price_per_night
        forecast = []
        
        for i in range(7):
            date = datetime.now().date() + timedelta(days=i)
            day_of_week = date.weekday()
            
            # Base multiplier
            multiplier = 1.0
            
            # Weekend adjustment
            if day_of_week >= 5:
                multiplier *= 1.15
            
            # Add some randomness for realism
            multiplier *= random.uniform(0.95, 1.05)
            
            predicted_price = int(base_price * multiplier)
            confidence = 0.85 - (i * 0.05)  # Confidence decreases over time
            
            forecast.append({
                'date': date.isoformat(),
                'day_name': date.strftime('%A'),
                'predicted_price': predicted_price,
                'confidence': round(confidence, 2),
                'is_weekend': day_of_week >= 5
            })
        
        return forecast
    
    def _calculate_demand_level(self, property_obj):
        """Calculate current demand level for a property"""
        # Count recent bookings
        week_ago = timezone.now() - timedelta(days=7)
        recent_bookings = Reservation.objects.filter(
            property=property_obj,
            created_at__gte=week_ago
        ).count()
        
        # Count recent views
        recent_views = PropertyView.objects.filter(
            property=property_obj,
            created_at__gte=week_ago
        ).count()
        
        # Calculate demand score
        demand_score = (recent_bookings * 20) + (recent_views * 2)
        
        # Count similar properties booked
        similar_booked = Reservation.objects.filter(
            property__country=property_obj.country,
            property__category=property_obj.category,
            created_at__gte=week_ago,
            status='approved'
        ).count()
        
        # Determine level
        if demand_score >= 80:
            level = 'very_high'
        elif demand_score >= 50:
            level = 'high'
        elif demand_score >= 20:
            level = 'medium'
        else:
            level = 'low'
        
        return {
            'level': level,
            'score': min(100, demand_score),
            'similar_booked': similar_booked
        }
    
    def _generate_booking_recommendation(self, price_analysis, demand, check_in):
        """Generate actionable booking recommendation"""
        trend = price_analysis['trend']
        demand_level = demand['level']
        
        if demand_level == 'very_high' and trend == 'rising':
            return "🔥 High demand! Book now to secure this price before it increases."
        elif demand_level == 'high':
            return "⚡ Popular property! Consider booking soon to avoid missing out."
        elif trend == 'falling':
            return "📉 Prices are dropping. You might save more by waiting a few days."
        elif trend == 'rising':
            return "📈 Prices are trending up. Booking now could save you money."
        else:
            return "✅ Good time to book! Prices are stable with moderate demand."
    
    def _get_price_factors(self, check_in, country):
        """Get factors affecting the price"""
        factors = []
        
        if check_in:
            try:
                check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
                
                # Weekend check
                if check_in_date.weekday() >= 5:
                    factors.append({
                        'factor': 'Weekend',
                        'impact': '+15%',
                        'description': 'Weekend rates are typically higher'
                    })
                
                # Holiday check (simplified)
                month = check_in_date.month
                if month in [6, 7, 8]:
                    factors.append({
                        'factor': 'Peak Season',
                        'impact': '+25-30%',
                        'description': 'Summer months have higher demand'
                    })
                elif month == 12:
                    factors.append({
                        'factor': 'Holiday Season',
                        'impact': '+15%',
                        'description': 'December holidays increase prices'
                    })
            except ValueError:
                pass
        
        # Add general factors
        factors.append({
            'factor': 'Location',
            'impact': 'Varies',
            'description': f'Prices in {country} depend on local events and seasons'
        })
        
        return factors
    
    def _get_location_pricing_insights(self, location, request):
        """Get pricing insights for a location"""
        # Get or create location price index
        index = LocationPriceIndex.objects.filter(
            Q(country__icontains=location) | Q(city__icontains=location)
        ).first()
        
        if index:
            serializer = LocationPriceIndexSerializer(index)
            return Response(serializer.data)
        
        # Return general insights if no specific data
        return Response({
            'location': location or 'General',
            'message': 'Location-specific pricing data not available',
            'general_tips': [
                'Book 2-4 weeks in advance for best prices',
                'Weekday stays are typically 15-20% cheaper',
                'Off-peak months (Jan-Mar, Sep-Nov) offer best rates',
                'Last-minute deals can save up to 30%'
            ]
        })


# ============================================================================
# 3. CHATBOT FOR INSTANT TRAVEL ASSISTANCE
# ============================================================================

class TravelChatbotView(APIView):
    """
    AI-powered chatbot for:
    - Property search assistance
    - Booking help
    - Travel recommendations
    - FAQ and support
    """
    authentication_classes = [ClerkAuthentication]
    
    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        message = serializer.validated_data['message'].lower()
        session_id = serializer.validated_data.get('session_id', str(uuid.uuid4()))
        user = request.user if request.user.is_authenticated else None
        
        # Analyze intent
        intent, entities = self._analyze_intent(message)
        
        # Generate response based on intent
        response_data = self._generate_response(intent, entities, message, user)
        
        # Save conversation
        ChatbotConversation.objects.create(
            user=user,
            session_id=session_id,
            message_type='user',
            message=message,
            intent=intent,
            extracted_entities=entities
        )
        
        ChatbotConversation.objects.create(
            user=user,
            session_id=session_id,
            message_type='bot',
            message=response_data['response'],
            intent=intent,
            suggested_properties=response_data.get('property_ids', [])
        )
        
        return Response({
            'session_id': session_id,
            'response': response_data['response'],
            'intent': intent,
            'suggestions': response_data.get('suggestions', []),
            'properties': response_data.get('properties', []),
            'actions': response_data.get('actions', []),
            'follow_up_questions': response_data.get('follow_up', [])
        })
    
    def _analyze_intent(self, message):
        """Analyze user message to determine intent and extract entities"""
        message = message.lower()
        entities = {}
        
        # Intent patterns
        intent_patterns = {
            'greeting': ['hi', 'hello', 'hey', 'good morning', 'good evening', 'howdy'],
            'search_property': ['find', 'search', 'looking for', 'show me', 'any properties', 'places to stay', 'accommodation'],
            'booking_help': ['book', 'reserve', 'how to book', 'booking', 'reservation', 'make a booking'],
            'price_inquiry': ['price', 'cost', 'how much', 'expensive', 'cheap', 'affordable', 'budget'],
            'recommendation': ['recommend', 'suggest', 'best', 'top rated', 'popular', 'where should'],
            'itinerary': ['itinerary', 'plan', 'trip', 'schedule', 'things to do', 'activities'],
            'support': ['help', 'support', 'problem', 'issue', 'refund', 'cancel', 'contact'],
        }
        
        # Determine intent
        detected_intent = 'general'
        for intent, patterns in intent_patterns.items():
            if any(pattern in message for pattern in patterns):
                detected_intent = intent
                break
        
        # Extract entities
        # Location extraction (simple pattern matching)
        location_keywords = ['in', 'at', 'near', 'around', 'to']
        for keyword in location_keywords:
            if f' {keyword} ' in f' {message} ':
                parts = message.split(keyword)
                if len(parts) > 1:
                    potential_location = parts[1].strip().split()[0] if parts[1].strip() else ''
                    if potential_location and len(potential_location) > 2:
                        entities['location'] = potential_location.title()
                        break
        
        # Guest count extraction
        import re
        guest_match = re.search(r'(\d+)\s*(guest|people|person|adult)', message)
        if guest_match:
            entities['guests'] = int(guest_match.group(1))
        
        # Date extraction (basic)
        date_patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}'
        ]
        for pattern in date_patterns:
            date_match = re.search(pattern, message, re.IGNORECASE)
            if date_match:
                entities['date_mentioned'] = date_match.group(0)
                break
        
        # Category extraction
        categories = ['beach', 'mountain', 'city', 'countryside', 'lake', 'tropical', 'ski', 'desert']
        for category in categories:
            if category in message:
                entities['category'] = category.title()
                break
        
        return detected_intent, entities
    
    def _generate_response(self, intent, entities, message, user):
        """Generate appropriate response based on intent"""
        
        if intent == 'greeting':
            return self._handle_greeting(user)
        
        elif intent == 'search_property':
            return self._handle_search(entities, user)
        
        elif intent == 'booking_help':
            return self._handle_booking_help()
        
        elif intent == 'price_inquiry':
            return self._handle_price_inquiry(entities)
        
        elif intent == 'recommendation':
            return self._handle_recommendation(entities, user)
        
        elif intent == 'itinerary':
            return self._handle_itinerary(entities, user)
        
        elif intent == 'support':
            return self._handle_support(message)
        
        else:
            return self._handle_general(message, user)
    
    def _handle_greeting(self, user):
        name = user.name if user else 'there'
        return {
            'response': f"Hello {name}! 👋 Welcome to FlexBnB! I'm here to help you find the perfect stay. What are you looking for today?",
            'suggestions': [
                {'text': '🔍 Search properties', 'action': 'search'},
                {'text': '💡 Get recommendations', 'action': 'recommend'},
                {'text': '📅 Plan a trip', 'action': 'itinerary'},
                {'text': '💰 Check prices', 'action': 'pricing'}
            ],
            'follow_up': [
                'Where would you like to stay?',
                'What type of property are you looking for?',
                'When are you planning to travel?'
            ]
        }
    
    def _handle_search(self, entities, user):
        filters = {}
        response_parts = ["I'll help you find the perfect place! "]
        
        if 'location' in entities:
            filters['country__icontains'] = entities['location']
            response_parts.append(f"Searching in **{entities['location']}**. ")
        
        if 'category' in entities:
            filters['category__icontains'] = entities['category']
            response_parts.append(f"Looking for **{entities['category']}** properties. ")
        
        if 'guests' in entities:
            filters['guests__gte'] = entities['guests']
            response_parts.append(f"For **{entities['guests']} guests**. ")
        
        # Search properties
        properties = Property.objects.filter(**filters)[:5]
        
        if properties.exists():
            serializer = PropertyListSerializer(properties, many=True)
            response_parts.append(f"\n\nI found {properties.count()} great options for you! 🏠")
            
            return {
                'response': ''.join(response_parts),
                'properties': serializer.data,
                'property_ids': [str(p.id) for p in properties],
                'actions': [
                    {'text': 'View all results', 'url': '/search', 'params': entities},
                    {'text': 'Refine search', 'action': 'refine'}
                ],
                'follow_up': [
                    'Would you like to filter by price?',
                    'Need more bedrooms?',
                    'Looking for specific amenities?'
                ]
            }
        else:
            return {
                'response': "I couldn't find exact matches, but here are some popular alternatives:",
                'properties': PropertyListSerializer(Property.objects.all()[:5], many=True).data,
                'suggestions': [
                    {'text': 'Try different location', 'action': 'search'},
                    {'text': 'Expand search criteria', 'action': 'search'},
                    {'text': 'View all properties', 'url': '/search'}
                ]
            }
    
    def _handle_booking_help(self):
        return {
            'response': """📚 **How to Book on FlexBnB:**

1. **Find a Property** - Search or browse our listings
2. **Select Dates** - Choose your check-in and check-out dates
3. **Review Details** - Check the price, amenities, and policies
4. **Book Now** - Click 'Reserve' and complete payment
5. **Confirmation** - You'll receive a confirmation email

Need help with a specific step?""",
            'suggestions': [
                {'text': '🔍 Start searching', 'url': '/search'},
                {'text': '📖 View my reservations', 'url': '/MyReservations'},
                {'text': '❓ Contact support', 'action': 'support'}
            ],
            'follow_up': [
                'Are you having trouble with a specific booking?',
                'Would you like to know about our cancellation policy?'
            ]
        }
    
    def _handle_price_inquiry(self, entities):
        location = entities.get('location', 'your destination')
        
        # Get price range for location
        properties = Property.objects.all()
        if 'location' in entities:
            properties = properties.filter(country__icontains=entities['location'])
        
        if properties.exists():
            avg_price = properties.aggregate(avg=Avg('price_per_night'))['avg'] or 0
            min_price = properties.order_by('price_per_night').first().price_per_night
            max_price = properties.order_by('-price_per_night').first().price_per_night
            
            return {
                'response': f"""💰 **Price Insights for {location}:**

• **Average:** ${avg_price:.0f}/night
• **Budget-friendly:** From ${min_price}/night
• **Premium:** Up to ${max_price}/night

💡 **Tips to save:**
• Book on weekdays (15-20% cheaper)
• Travel in off-peak months
• Book 2-4 weeks in advance""",
                'actions': [
                    {'text': '📊 View price trends', 'url': '/pricing-insights'},
                    {'text': '🔍 Search by budget', 'action': 'search_budget'}
                ]
            }
        
        return {
            'response': "Tell me your destination and I'll show you the best prices! Where are you planning to go?",
            'follow_up': ['What\'s your budget per night?', 'Which city or country?']
        }
    
    def _handle_recommendation(self, entities, user):
        properties = Property.objects.annotate(
            avg_rating=Avg('reviews__rating')
        ).filter(avg_rating__isnull=False).order_by('-avg_rating')
        
        if 'location' in entities:
            properties = properties.filter(country__icontains=entities['location'])
        
        if 'category' in entities:
            properties = properties.filter(category__icontains=entities['category'])
        
        top_properties = properties[:5]
        
        if top_properties.exists():
            serializer = PropertyListSerializer(top_properties, many=True)
            location_text = f"in {entities.get('location', 'our platform')}"
            
            return {
                'response': f"⭐ **Top Recommended Properties {location_text}:**\n\nHere are our highest-rated stays, loved by travelers!",
                'properties': serializer.data,
                'property_ids': [str(p.id) for p in top_properties],
                'follow_up': [
                    'Want recommendations for a specific type?',
                    'Need family-friendly options?',
                    'Looking for romantic getaways?'
                ]
            }
        
        return {
            'response': "I'd love to recommend the perfect place! Tell me more about:\n• Where you'd like to go\n• What type of experience you want\n• Your travel dates",
            'suggestions': [
                {'text': '🏖️ Beach getaway', 'action': 'recommend_beach'},
                {'text': '🏔️ Mountain escape', 'action': 'recommend_mountain'},
                {'text': '🏙️ City adventure', 'action': 'recommend_city'}
            ]
        }
    
    def _handle_itinerary(self, entities, user):
        location = entities.get('location', '')
        
        return {
            'response': f"""🗓️ **Smart Itinerary Planner**

I can help you plan the perfect trip{f' to {location}' if location else ''}!

Tell me:
1. **Where** are you traveling?
2. **When** (dates)?
3. **What** interests you? (adventure, culture, food, relaxation)

I'll create a personalized day-by-day itinerary for you!""",
            'actions': [
                {'text': '📅 Open Itinerary Planner', 'url': '/itinerary-planner'},
                {'text': '📋 View my itineraries', 'url': '/my-itineraries'}
            ],
            'follow_up': [
                'How many days will you be traveling?',
                'Do you prefer packed schedules or relaxed pace?',
                'Any must-see attractions?'
            ]
        }
    
    def _handle_support(self, message):
        # Check for specific issues
        if any(word in message for word in ['refund', 'money back', 'cancel']):
            return {
                'response': """🔄 **Cancellation & Refunds:**

Our cancellation policy depends on the property. Generally:
• **Free cancellation:** 48+ hours before check-in
• **Partial refund:** 24-48 hours before check-in
• **No refund:** Less than 24 hours

To request a cancellation:
1. Go to 'My Reservations'
2. Select the booking
3. Click 'Cancel Reservation'

For special circumstances, contact our support team.""",
                'actions': [
                    {'text': '📖 My Reservations', 'url': '/MyReservations'},
                    {'text': '📧 Contact Support', 'url': '/support'}
                ]
            }
        
        return {
            'response': """🤝 **How can I help?**

I'm here to assist with:
• 🔍 Finding properties
• 📅 Booking assistance
• 💰 Pricing questions
• 🗓️ Trip planning
• ❓ General inquiries

What do you need help with?""",
            'suggestions': [
                {'text': '🔄 Cancellation help', 'action': 'support_cancel'},
                {'text': '💳 Payment issues', 'action': 'support_payment'},
                {'text': '🏠 Property questions', 'action': 'support_property'},
                {'text': '📧 Contact human support', 'url': '/support'}
            ]
        }
    
    def _handle_general(self, message, user):
        return {
            'response': """I'm not sure I understood that. Let me help you with what I do best! 😊

I can assist with:
• 🔍 **Finding properties** - Just tell me where and when
• 💡 **Recommendations** - Get personalized suggestions
• 💰 **Price insights** - Best time to book
• 🗓️ **Trip planning** - Create smart itineraries
• ❓ **Booking help** - Step-by-step assistance

What would you like to explore?""",
            'suggestions': [
                {'text': '🔍 Search properties', 'action': 'search'},
                {'text': '💡 Get recommendations', 'action': 'recommend'},
                {'text': '💰 Check prices', 'action': 'pricing'},
                {'text': '📅 Plan a trip', 'action': 'itinerary'}
            ]
        }


# ============================================================================
# 4. SMART ITINERARY PLANNING BASED ON TRIP DURATION
# ============================================================================

class SmartItineraryView(APIView):
    """
    AI-powered itinerary planning that:
    - Suggests activities based on destination and duration
    - Considers user preferences
    - Optimizes daily schedules
    - Integrates with booked properties
    """
    authentication_classes = [ClerkAuthentication]
    
    def get(self, request):
        """Get user's itineraries"""
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        
        itineraries = Itinerary.objects.filter(user=user)
        serializer = ItinerarySerializer(itineraries, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Generate a new smart itinerary"""
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        
        data = request.data
        destination = data.get('destination', '')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        interests = data.get('interests', [])
        pace = data.get('pace', 'moderate')  # relaxed, moderate, packed
        property_id = data.get('property_id')
        
        if not all([destination, start_date, end_date]):
            return Response({
                'error': 'destination, start_date, and end_date are required'
            }, status=400)
        
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
        
        duration = (end - start).days + 1
        
        # Generate itinerary
        activities = self._generate_activities(destination, duration, interests, pace)
        restaurants = self._generate_restaurant_suggestions(destination, duration)
        attractions = self._generate_attractions(destination, interests)
        transportation = self._generate_transportation_tips(destination)
        ai_suggestions = self._generate_ai_suggestions(destination, duration, interests)
        weather = self._get_weather_forecast(destination, start_date)
        
        # Create itinerary
        property_obj = None
        if property_id:
            property_obj = Property.objects.filter(id=property_id).first()
        
        itinerary = Itinerary.objects.create(
            user=user,
            title=f"{duration}-Day Trip to {destination}",
            destination=destination,
            start_date=start,
            end_date=end,
            property=property_obj,
            activities=activities,
            restaurants=restaurants,
            attractions=attractions,
            transportation=transportation,
            ai_suggestions=ai_suggestions,
            weather_forecast=weather
        )
        
        serializer = ItinerarySerializer(itinerary)
        return Response(serializer.data, status=201)
    
    def _generate_activities(self, destination, duration, interests, pace):
        """Generate day-by-day activities"""
        activities_per_day = {
            'relaxed': 2,
            'moderate': 3,
            'packed': 5
        }.get(pace, 3)
        
        # Activity templates based on interests
        activity_templates = {
            'adventure': [
                {'time': '09:00', 'activity': 'Morning hiking trail', 'duration': '3 hours', 'type': 'outdoor'},
                {'time': '14:00', 'activity': 'Water sports adventure', 'duration': '2 hours', 'type': 'adventure'},
                {'time': '17:00', 'activity': 'Sunset viewpoint visit', 'duration': '1.5 hours', 'type': 'scenic'},
            ],
            'culture': [
                {'time': '10:00', 'activity': 'Museum visit', 'duration': '2 hours', 'type': 'cultural'},
                {'time': '14:00', 'activity': 'Historical walking tour', 'duration': '2.5 hours', 'type': 'tour'},
                {'time': '19:00', 'activity': 'Local cultural show', 'duration': '2 hours', 'type': 'entertainment'},
            ],
            'food': [
                {'time': '10:00', 'activity': 'Food market tour', 'duration': '2 hours', 'type': 'food'},
                {'time': '14:00', 'activity': 'Cooking class', 'duration': '3 hours', 'type': 'experience'},
                {'time': '20:00', 'activity': 'Fine dining experience', 'duration': '2 hours', 'type': 'food'},
            ],
            'relaxation': [
                {'time': '10:00', 'activity': 'Spa and wellness session', 'duration': '2 hours', 'type': 'wellness'},
                {'time': '14:00', 'activity': 'Beach/Pool time', 'duration': '3 hours', 'type': 'leisure'},
                {'time': '18:00', 'activity': 'Sunset yoga', 'duration': '1 hour', 'type': 'wellness'},
            ],
            'default': [
                {'time': '09:00', 'activity': f'Explore {destination} highlights', 'duration': '3 hours', 'type': 'sightseeing'},
                {'time': '14:00', 'activity': 'Local neighborhood walk', 'duration': '2 hours', 'type': 'explore'},
                {'time': '17:00', 'activity': 'Relax at local café', 'duration': '1.5 hours', 'type': 'leisure'},
            ]
        }
        
        all_activities = []
        for day in range(1, duration + 1):
            day_activities = []
            
            # Mix activities based on interests
            if interests:
                for interest in interests[:2]:
                    templates = activity_templates.get(interest.lower(), activity_templates['default'])
                    for activity in templates[:activities_per_day]:
                        day_activities.append({
                            **activity,
                            'day': day,
                            'location': f'{destination} Area'
                        })
            else:
                templates = activity_templates['default']
                for activity in templates[:activities_per_day]:
                    day_activities.append({
                        **activity,
                        'day': day,
                        'location': f'{destination} Area'
                    })
            
            all_activities.extend(day_activities[:activities_per_day])
        
        return all_activities
    
    def _generate_restaurant_suggestions(self, destination, duration):
        """Generate restaurant suggestions"""
        meal_types = ['breakfast', 'lunch', 'dinner']
        restaurants = []
        
        for day in range(1, duration + 1):
            for meal in meal_types:
                restaurants.append({
                    'day': day,
                    'meal': meal,
                    'suggestion': f'Local {meal} spot in {destination}',
                    'cuisine': 'Local',
                    'price_range': '$$',
                    'reservation_recommended': meal == 'dinner'
                })
        
        return restaurants
    
    def _generate_attractions(self, destination, interests):
        """Generate must-see attractions"""
        base_attractions = [
            {
                'name': f'{destination} Main Square/Center',
                'type': 'landmark',
                'priority': 'must-see',
                'estimated_time': '1-2 hours',
                'best_time': 'morning or evening'
            },
            {
                'name': f'{destination} Historical District',
                'type': 'historical',
                'priority': 'recommended',
                'estimated_time': '2-3 hours',
                'best_time': 'afternoon'
            },
            {
                'name': f'Local Market in {destination}',
                'type': 'shopping',
                'priority': 'recommended',
                'estimated_time': '1-2 hours',
                'best_time': 'morning'
            }
        ]
        
        return base_attractions
    
    def _generate_transportation_tips(self, destination):
        """Generate transportation tips"""
        return [
            {
                'type': 'arrival',
                'tip': f'From airport to {destination} center: taxi (~30 min) or public transport (~45 min)',
                'estimated_cost': '$15-40'
            },
            {
                'type': 'local',
                'tip': 'Walking is recommended for the city center. Consider ride-sharing apps for longer distances.',
                'estimated_cost': '$5-15 per trip'
            },
            {
                'type': 'day_trips',
                'tip': 'Rental cars or organized tours available for nearby attractions',
                'estimated_cost': '$30-80 per day'
            }
        ]
    
    def _generate_ai_suggestions(self, destination, duration, interests):
        """Generate AI-powered suggestions"""
        suggestions = [
            f"📸 Best photo spots in {destination}: City viewpoints and local landmarks",
            f"💡 Pro tip: Visit popular attractions early morning to avoid crowds",
            f"🎒 Pack light layers as weather can vary throughout the day",
        ]
        
        if duration >= 3:
            suggestions.append(f"🚗 Consider a day trip to nearby attractions on day 2 or 3")
        
        if duration >= 5:
            suggestions.append(f"😌 Build in a rest day around day {duration // 2} to recharge")
        
        if 'adventure' in [i.lower() for i in interests]:
            suggestions.append("🏃 Book adventure activities in advance - they fill up quickly!")
        
        if 'food' in [i.lower() for i in interests]:
            suggestions.append("🍽️ Ask locals for restaurant recommendations - best finds are often hidden gems!")
        
        return suggestions
    
    def _get_weather_forecast(self, destination, start_date):
        """Get weather forecast (simulated)"""
        # In production, this would call a weather API
        return {
            'summary': 'Partly cloudy with occasional sunshine',
            'temperature': {
                'high': 25,
                'low': 18,
                'unit': 'celsius'
            },
            'precipitation_chance': 20,
            'recommendation': 'Pack layers and a light rain jacket just in case'
        }


class ItineraryViewSet(viewsets.ModelViewSet):
    """CRUD operations for itineraries"""
    serializer_class = ItinerarySerializer
    authentication_classes = [ClerkAuthentication]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Itinerary.objects.filter(user=self.request.user)
        return Itinerary.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ============================================================================
# 5. GUEST PREFERENCE MATCHING FOR BEST STAY EXPERIENCE
# ============================================================================

class GuestPreferenceMatchingView(APIView):
    """
    Matches guests with properties based on:
    - Explicit preferences
    - Behavioral patterns
    - Similar guest reviews
    - Property characteristics
    """
    authentication_classes = [ClerkAuthentication]
    
    def get(self, request):
        """Get matched properties for the user"""
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        
        # Check for existing fresh matches
        fresh_matches = GuestMatch.objects.filter(
            user=user,
            is_dismissed=False,
            expires_at__gt=timezone.now()
        ).order_by('-overall_match_score')[:10]
        
        if fresh_matches.exists():
            serializer = GuestMatchSerializer(fresh_matches, many=True)
            return Response({
                'matches': serializer.data,
                'match_count': fresh_matches.count(),
                'last_updated': fresh_matches.first().created_at
            })
        
        # Generate new matches
        matches = self._generate_matches(user)
        serializer = GuestMatchSerializer(matches, many=True)
        
        return Response({
            'matches': serializer.data,
            'match_count': len(matches),
            'newly_generated': True
        })
    
    def post(self, request):
        """Update user preferences and regenerate matches"""
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        
        # Update or create preferences
        preference, created = UserPreference.objects.get_or_create(user=user)
        
        serializer = UserPreferenceSerializer(preference, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Clear old matches
            GuestMatch.objects.filter(user=user).delete()
            
            # Generate new matches
            matches = self._generate_matches(user)
            
            return Response({
                'preferences': serializer.data,
                'matches': GuestMatchSerializer(matches, many=True).data,
                'message': 'Preferences updated and matches regenerated'
            })
        
        return Response(serializer.errors, status=400)
    
    def _generate_matches(self, user):
        """Generate property matches for user"""
        # Get or create preferences
        preference, _ = UserPreference.objects.get_or_create(user=user)
        
        # Get all properties
        properties = Property.objects.all()
        
        matches = []
        expires_at = timezone.now() + timedelta(days=7)
        
        for prop in properties:
            # Calculate match scores
            scores = self._calculate_match_scores(prop, preference, user)
            
            if scores['overall'] >= 50:  # Minimum 50% match
                match, created = GuestMatch.objects.update_or_create(
                    user=user,
                    property=prop,
                    defaults={
                        'overall_match_score': scores['overall'],
                        'category_match': scores['category'],
                        'price_match': scores['price'],
                        'location_match': scores['location'],
                        'amenities_match': scores['amenities'],
                        'style_match': scores['style'],
                        'match_reasons': scores['reasons'],
                        'expires_at': expires_at
                    }
                )
                matches.append(match)
        
        # Sort by overall score
        matches.sort(key=lambda x: x.overall_match_score, reverse=True)
        return matches[:10]
    
    def _calculate_match_scores(self, property_obj, preference, user):
        """Calculate match scores between property and user preferences"""
        scores = {
            'category': 0,
            'price': 0,
            'location': 0,
            'amenities': 0,
            'style': 0,
            'reasons': []
        }
        
        # Category match
        if preference.preferred_categories:
            if property_obj.category in preference.preferred_categories:
                scores['category'] = 100
                scores['reasons'].append(f"Matches your preferred category: {property_obj.category}")
            else:
                scores['category'] = 30
        else:
            scores['category'] = 70  # Neutral
        
        # Price match
        if preference.max_price_per_night:
            if property_obj.price_per_night <= preference.max_price_per_night:
                price_ratio = property_obj.price_per_night / preference.max_price_per_night
                scores['price'] = 100 - (price_ratio * 30)  # Cheaper = higher score
                scores['reasons'].append(f"Within your budget (${property_obj.price_per_night}/night)")
            else:
                scores['price'] = 20
        else:
            scores['price'] = 70
        
        # Location match
        if preference.preferred_countries:
            if property_obj.country in preference.preferred_countries:
                scores['location'] = 100
                scores['reasons'].append(f"Located in {property_obj.country} - one of your favorites")
            else:
                scores['location'] = 40
        else:
            scores['location'] = 70
        
        # Guest capacity match
        if property_obj.guests >= preference.typical_group_size:
            scores['amenities'] += 50
            scores['reasons'].append(f"Perfect for your group size ({property_obj.guests} guests)")
        
        # Bedroom match
        if property_obj.bedrooms >= preference.min_bedrooms:
            scores['amenities'] += 50
        else:
            scores['amenities'] = max(0, scores['amenities'] - 20)
        
        # Style match based on budget preference
        budget_price_ranges = {
            'budget': (0, 100),
            'moderate': (50, 200),
            'luxury': (150, 10000),
            'any': (0, 10000)
        }
        
        price_range = budget_price_ranges.get(preference.budget_preference, (0, 10000))
        if price_range[0] <= property_obj.price_per_night <= price_range[1]:
            scores['style'] = 100
            if preference.budget_preference == 'luxury' and property_obj.price_per_night > 200:
                scores['reasons'].append("Premium luxury property")
            elif preference.budget_preference == 'budget':
                scores['reasons'].append("Great value for money")
        else:
            scores['style'] = 50
        
        # Calculate overall score
        weights = {
            'category': 0.25,
            'price': 0.25,
            'location': 0.20,
            'amenities': 0.15,
            'style': 0.15
        }
        
        scores['overall'] = sum(
            scores[key] * weight
            for key, weight in weights.items()
        )
        
        # Boost for highly-rated properties
        avg_rating = PropertyReview.objects.filter(
            property=property_obj
        ).aggregate(avg=Avg('rating'))['avg'] or 0
        
        if avg_rating >= 4.5:
            scores['overall'] = min(100, scores['overall'] + 10)
            scores['reasons'].append(f"Highly rated ({avg_rating:.1f}⭐)")
        
        return scores


# ============================================================================
# USER PREFERENCES VIEWSET
# ============================================================================

class UserPreferenceViewSet(viewsets.ModelViewSet):
    """Manage user preferences"""
    serializer_class = UserPreferenceSerializer
    authentication_classes = [ClerkAuthentication]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return UserPreference.objects.filter(user=self.request.user)
        return UserPreference.objects.none()
    
    def get_object(self):
        preference, _ = UserPreference.objects.get_or_create(user=self.request.user)
        return preference
    
    def list(self, request):
        preference, _ = UserPreference.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(preference)
        return Response(serializer.data)
    
    def create(self, request):
        preference, created = UserPreference.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(preference, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201 if created else 200)
        return Response(serializer.errors, status=400)


# ============================================================================
# TRACKING VIEWS (Search History & Property Views)
# ============================================================================

@api_view(['POST'])
def track_search(request):
    """Track user search for better recommendations"""
    user = request.user if request.user.is_authenticated else None
    session_id = request.data.get('session_id', '')
    
    SearchHistory.objects.create(
        user=user,
        session_id=session_id,
        search_query=request.data.get('query', ''),
        location=request.data.get('location', ''),
        category=request.data.get('category', ''),
        check_in_date=request.data.get('check_in_date'),
        check_out_date=request.data.get('check_out_date'),
        guests_count=request.data.get('guests', 1),
        min_price=request.data.get('min_price'),
        max_price=request.data.get('max_price'),
        results_count=request.data.get('results_count', 0)
    )
    
    return Response({'status': 'tracked'})


@api_view(['POST'])
def track_property_view(request):
    """Track property view for recommendations"""
    user = request.user if request.user.is_authenticated else None
    property_id = request.data.get('property_id')
    
    if not property_id:
        return Response({'error': 'property_id required'}, status=400)
    
    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({'error': 'Property not found'}, status=404)
    
    PropertyView.objects.create(
        user=user,
        session_id=request.data.get('session_id', ''),
        property=property_obj,
        view_duration=request.data.get('duration', 0),
        viewed_images=request.data.get('viewed_images', False),
        viewed_reviews=request.data.get('viewed_reviews', False),
        added_to_wishlist=request.data.get('wishlist', False),
        initiated_booking=request.data.get('initiated_booking', False)
    )
    
    return Response({'status': 'tracked'})

