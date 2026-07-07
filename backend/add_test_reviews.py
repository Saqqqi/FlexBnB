import os
import sys
import django
from datetime import datetime, timedelta

sys.path.insert(0, '/usr/src/flexbnb_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flexbnb_backend.settings')
django.setup()

from booking.models import PropertyReview, Reservation
from property.models import Property
from useraccount.models import User

# Get the property
property_obj = Property.objects.get(id='4dc7b25e-6440-4f78-bf57-c72ade99472c')
print(f"Property: {property_obj.title}")

# Get or create test users
guest1, _ = User.objects.get_or_create(
    email='guest1@test.com',
    defaults={'name': 'John Smith'}
)
guest2, _ = User.objects.get_or_create(
    email='guest2@test.com', 
    defaults={'name': 'Sarah Johnson'}
)
guest3, _ = User.objects.get_or_create(
    email='guest3@test.com',
    defaults={'name': 'Michael Brown'}
)

print(f"Created/found {User.objects.count()} users")

# Create reservations for the past (so they can review)
past_date = datetime.now().date() - timedelta(days=30)
checkout_date = past_date + timedelta(days=2)

# Create reservations
reservations = []
for i, guest in enumerate([guest1, guest2, guest3], 1):
    res, created = Reservation.objects.get_or_create(
        property=property_obj,
        guest=guest,
        host=property_obj.Host,
        defaults={
            'check_in_date': past_date - timedelta(days=i*10),
            'check_out_date': checkout_date - timedelta(days=i*10),
            'guests_count': 2,
            'total_price': 150.00,
            'status': 'approved'
        }
    )
    reservations.append(res)
    print(f"Reservation {i}: {res.id} - {guest.name}")

# Sample reviews data
reviews_data = [
    {
        'guest': guest1,
        'rating': 5,
        'comment': 'Absolutely wonderful stay! The property was spotless and the host was very accommodating. Would definitely recommend to anyone visiting the area.',
        'cleanliness_rating': 5,
        'communication_rating': 5,
        'location_rating': 5,
        'value_rating': 5,
    },
    {
        'guest': guest2,
        'rating': 4,
        'comment': 'Great location and very clean. Minor issue with WiFi but host resolved it quickly. Overall a pleasant experience.',
        'cleanliness_rating': 5,
        'communication_rating': 4,
        'location_rating': 5,
        'value_rating': 4,
    },
    {
        'guest': guest3,
        'rating': 5,
        'comment': 'Perfect for our family vacation! The kids loved it and we appreciated how well-equipped the kitchen was. Will definitely book again!',
        'cleanliness_rating': 5,
        'communication_rating': 5,
        'location_rating': 4,
        'value_rating': 5,
    },
]

# Create reviews
for i, (reservation, review_data) in enumerate(zip(reservations, reviews_data), 1):
    # Check if review already exists
    if not hasattr(reservation, 'review'):
        review = PropertyReview.objects.create(
            property=property_obj,
            reservation=reservation,
            guest=review_data['guest'],
            **{k: v for k, v in review_data.items() if k != 'guest'}
        )
        print(f"Created review {i}: {review.rating} stars by {review.guest.name}")
    else:
        print(f"Review {i} already exists for reservation {reservation.id}")

print(f"\nTotal reviews: {PropertyReview.objects.filter(property=property_obj).count()}")
print("Done!")

