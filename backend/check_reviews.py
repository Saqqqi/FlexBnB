#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.insert(0, '/usr/src/flexbnb_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flexbnb_backend.settings')
django.setup()

from booking.models import PropertyReview

# Query all reviews
reviews = PropertyReview.objects.all()
print(f"Total PropertyReviews in database: {reviews.count()}")
print("\n" + "="*80)

for review in reviews[:10]:  # Show first 10 reviews
    print(f"\nReview ID: {review.id}")
    print(f"Property: {review.property.title}")
    print(f"Rating: {review.rating} stars")
    print(f"Comment: {review.comment[:100]}...")
    print(f"Guest: {review.guest_id}")
    print(f"Created: {review.created_at}")
    print("-"*80)

