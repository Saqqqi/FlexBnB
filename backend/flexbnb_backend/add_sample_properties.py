"""
Script to add sample properties with various features:
- Different categories
- Some with hourly booking enabled
- Some with room pooling enabled
- Varied prices and locations
"""

import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flexbnb_backend.settings')
django.setup()

from property.models import Property
from useraccount.models import User

# Sample property data
SAMPLE_PROPERTIES = [
    {
        "title": "Luxury Beachfront Villa",
        "description": "Stunning 5-bedroom villa with private beach access, infinity pool, and panoramic ocean views. Perfect for family vacations or group retreats. Features modern amenities, fully equipped gourmet kitchen, and outdoor BBQ area.",
        "price_per_night": 450,
        "bedrooms": 5,
        "bathrooms": 4,
        "guests": 10,
        "country": "Maldives",
        "country_code": "MV",
        "category": "BeachFront",
        "is_hourly_booking": False,
        "allow_room_pooling": True,
        "max_pool_members": 8,
    },
    {
        "title": "Modern City Penthouse",
        "description": "Sleek penthouse apartment in the heart of downtown with floor-to-ceiling windows, private rooftop terrace, and stunning skyline views. Walking distance to restaurants, shopping, and entertainment.",
        "price_per_night": 320,
        "price_per_hour": 45,
        "bedrooms": 3,
        "bathrooms": 2,
        "guests": 6,
        "country": "United States",
        "country_code": "US",
        "category": "Top Cities",
        "is_hourly_booking": True,
        "available_hours_start": "08:00:00",
        "available_hours_end": "22:00:00",
        "allow_room_pooling": False,
    },
    {
        "title": "Cozy Mountain Cabin",
        "description": "Rustic yet modern cabin nestled in the mountains. Features a wood-burning fireplace, hot tub, and breathtaking mountain views. Perfect for skiing in winter or hiking in summer.",
        "price_per_night": 180,
        "bedrooms": 2,
        "bathrooms": 1,
        "guests": 4,
        "country": "Switzerland",
        "country_code": "CH",
        "category": "Top Of The World",
        "is_hourly_booking": False,
        "allow_room_pooling": True,
        "max_pool_members": 4,
    },
    {
        "title": "Arctic Glass Igloo",
        "description": "Experience the Northern Lights from your heated glass igloo! This unique accommodation offers 360° views of the Arctic sky. Includes sauna, heated floors, and all modern comforts.",
        "price_per_night": 550,
        "bedrooms": 1,
        "bathrooms": 1,
        "guests": 2,
        "country": "Finland",
        "country_code": "FI",
        "category": "Artics",
        "is_hourly_booking": False,
        "allow_room_pooling": False,
    },
    {
        "title": "Historic Mansion Estate",
        "description": "Grand 19th-century mansion with 8 bedrooms, ballroom, library, and manicured gardens. Perfect for weddings, corporate events, or luxury family gatherings. Full staff available.",
        "price_per_night": 1200,
        "price_per_hour": 200,
        "bedrooms": 8,
        "bathrooms": 6,
        "guests": 16,
        "country": "United Kingdom",
        "country_code": "GB",
        "category": "Mansions",
        "is_hourly_booking": True,
        "available_hours_start": "10:00:00",
        "available_hours_end": "23:00:00",
        "allow_room_pooling": True,
        "max_pool_members": 12,
    },
    {
        "title": "Trendy Loft Space",
        "description": "Industrial-chic loft in a converted warehouse. Exposed brick, high ceilings, and contemporary art throughout. Perfect for creative professionals and urban explorers.",
        "price_per_night": 150,
        "price_per_hour": 25,
        "bedrooms": 1,
        "bathrooms": 1,
        "guests": 3,
        "country": "Germany",
        "country_code": "DE",
        "category": "Trending",
        "is_hourly_booking": True,
        "available_hours_start": "07:00:00",
        "available_hours_end": "21:00:00",
        "allow_room_pooling": False,
    },
    {
        "title": "Glamping Safari Tent",
        "description": "Luxury camping experience with king-size bed, en-suite bathroom, and private deck overlooking the savanna. Daily wildlife drives and gourmet meals included.",
        "price_per_night": 380,
        "bedrooms": 1,
        "bathrooms": 1,
        "guests": 2,
        "country": "Kenya",
        "country_code": "KE",
        "category": "Camping",
        "is_hourly_booking": False,
        "allow_room_pooling": True,
        "max_pool_members": 6,
    },
    {
        "title": "Organic Farm Stay",
        "description": "Working organic farm with cozy farmhouse accommodation. Enjoy fresh produce, farm animals, and countryside tranquility. Great for families and nature lovers.",
        "price_per_night": 95,
        "bedrooms": 3,
        "bathrooms": 2,
        "guests": 6,
        "country": "France",
        "country_code": "FR",
        "category": "Farms",
        "is_hourly_booking": False,
        "allow_room_pooling": True,
        "max_pool_members": 6,
    },
    {
        "title": "Geodesic Dome Retreat",
        "description": "Eco-friendly geodesic dome with panoramic views of the desert landscape. Solar-powered, with outdoor shower and stargazing deck. A unique off-grid experience.",
        "price_per_night": 220,
        "bedrooms": 1,
        "bathrooms": 1,
        "guests": 2,
        "country": "United States",
        "country_code": "US",
        "category": "Domes",
        "is_hourly_booking": False,
        "allow_room_pooling": False,
    },
    {
        "title": "Private Island Paradise",
        "description": "Exclusive private island with 3 villas, white sand beaches, and crystal-clear waters. Includes private chef, boat, and water sports equipment. The ultimate escape.",
        "price_per_night": 2500,
        "bedrooms": 6,
        "bathrooms": 6,
        "guests": 12,
        "country": "Thailand",
        "country_code": "TH",
        "category": "Amazing Views",
        "is_hourly_booking": False,
        "allow_room_pooling": True,
        "max_pool_members": 10,
    },
    {
        "title": "Tokyo City Room",
        "description": "Compact but efficient room in the heart of Shibuya. Walking distance to shopping, dining, and nightlife. Perfect for solo travelers or couples exploring Tokyo.",
        "price_per_night": 85,
        "price_per_hour": 15,
        "bedrooms": 1,
        "bathrooms": 1,
        "guests": 2,
        "country": "Japan",
        "country_code": "JP",
        "category": "Rooms",
        "is_hourly_booking": True,
        "available_hours_start": "06:00:00",
        "available_hours_end": "23:00:00",
        "allow_room_pooling": False,
    },
    {
        "title": "Tropical Treehouse",
        "description": "Unique treehouse accommodation surrounded by lush rainforest. Features a private deck, outdoor bathroom, and stunning jungle views. Adventure awaits!",
        "price_per_night": 175,
        "bedrooms": 1,
        "bathrooms": 1,
        "guests": 2,
        "country": "Costa Rica",
        "country_code": "CR",
        "category": "Trending",
        "is_hourly_booking": False,
        "allow_room_pooling": False,
    },
    {
        "title": "Ski-In Ski-Out Chalet",
        "description": "Luxury chalet with direct access to ski slopes. Hot tub, sauna, and chef's kitchen. Après-ski has never been this convenient!",
        "price_per_night": 650,
        "bedrooms": 4,
        "bathrooms": 3,
        "guests": 8,
        "country": "Austria",
        "country_code": "AT",
        "category": "Top Of The World",
        "is_hourly_booking": False,
        "allow_room_pooling": True,
        "max_pool_members": 8,
    },
    {
        "title": "NYC Meeting Space",
        "description": "Professional meeting room in Manhattan with state-of-the-art AV equipment, high-speed WiFi, and catering options. Perfect for business meetings or workshops.",
        "price_per_night": 500,
        "price_per_hour": 75,
        "bedrooms": 0,
        "bathrooms": 2,
        "guests": 20,
        "country": "United States",
        "country_code": "US",
        "category": "Rooms",
        "is_hourly_booking": True,
        "available_hours_start": "08:00:00",
        "available_hours_end": "20:00:00",
        "allow_room_pooling": True,
        "max_pool_members": 20,
    },
    {
        "title": "Seaside Cottage",
        "description": "Charming cottage just steps from the beach. Features a sun-drenched deck, outdoor shower, and all the seaside charm you could want. Pet friendly!",
        "price_per_night": 165,
        "bedrooms": 2,
        "bathrooms": 1,
        "guests": 4,
        "country": "Portugal",
        "country_code": "PT",
        "category": "BeachFront",
        "is_hourly_booking": False,
        "allow_room_pooling": True,
        "max_pool_members": 4,
    },
]

def create_sample_properties():
    """Create sample properties using the first available host user"""
    
    # Get or create a host user
    host = User.objects.first()
    if not host:
        print("No users found in the database. Please create a user first.")
        return
    
    print(f"Using host: {host.email}")
    
    # Check existing properties
    existing_count = Property.objects.count()
    print(f"Existing properties: {existing_count}")
    
    created_count = 0
    for prop_data in SAMPLE_PROPERTIES:
        # Check if property with this title already exists
        if Property.objects.filter(title=prop_data["title"]).exists():
            print(f"Property '{prop_data['title']}' already exists. Skipping.")
            continue
        
        # Create the property
        try:
            property_obj = Property.objects.create(
                title=prop_data["title"],
                description=prop_data["description"],
                price_per_night=prop_data["price_per_night"],
                price_per_hour=prop_data.get("price_per_hour"),
                is_hourly_booking=prop_data.get("is_hourly_booking", False),
                available_hours_start=prop_data.get("available_hours_start"),
                available_hours_end=prop_data.get("available_hours_end"),
                bedrooms=prop_data["bedrooms"],
                bathrooms=prop_data["bathrooms"],
                guests=prop_data["guests"],
                country=prop_data["country"],
                country_code=prop_data["country_code"],
                category=prop_data["category"],
                image="uploads/properties/sample_placeholder.jpg",  # Placeholder
                Host=host,
                allow_room_pooling=prop_data.get("allow_room_pooling", False),
                max_pool_members=prop_data.get("max_pool_members", 6),
            )
            created_count += 1
            
            features = []
            if prop_data.get("is_hourly_booking"):
                features.append("⏰ Hourly")
            if prop_data.get("allow_room_pooling"):
                features.append("🏠 Room Pool")
            
            print(f"✅ Created: {property_obj.title} [{prop_data['category']}] {' '.join(features)}")
            
        except Exception as e:
            print(f"❌ Failed to create '{prop_data['title']}': {e}")
    
    print(f"\n✨ Created {created_count} new properties")
    print(f"📊 Total properties now: {Property.objects.count()}")

if __name__ == "__main__":
    create_sample_properties()

