import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from useraccount.models import User
from property.models import Property
from booking.models import Reservation


class RoommateProfile(models.Model):
    """Profile for roommate matching compatibility"""
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('no_preference', 'No Preference'),
    ]
    
    SLEEP_SCHEDULE_CHOICES = [
        ('early_bird', 'Early Bird (Sleep before 10pm)'),
        ('night_owl', 'Night Owl (Sleep after midnight)'),
        ('flexible', 'Flexible'),
    ]
    
    CLEANLINESS_CHOICES = [
        ('very_clean', 'Very Clean & Organized'),
        ('moderate', 'Moderately Clean'),
        ('relaxed', 'Relaxed about cleanliness'),
    ]
    
    NOISE_CHOICES = [
        ('quiet', 'Prefer Quiet Environment'),
        ('moderate', 'Some noise is fine'),
        ('social', 'Love socializing & noise'),
    ]
    
    SMOKING_CHOICES = [
        ('non_smoker', 'Non-Smoker'),
        ('smoker', 'Smoker'),
        ('outdoor_only', 'Outdoor Smoker Only'),
        ('no_preference', 'No Preference'),
    ]
    
    AGE_GROUP_CHOICES = [
        ('18_25', '18-25'),
        ('26_35', '26-35'),
        ('36_45', '36-45'),
        ('46_55', '46-55'),
        ('56_plus', '56+'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, related_name='roommate_profile', on_delete=models.CASCADE)
    
    # Basic preferences
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='no_preference')
    preferred_gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='no_preference')
    age_group = models.CharField(max_length=20, choices=AGE_GROUP_CHOICES, blank=True)
    preferred_age_groups = models.JSONField(default=list)  # List of preferred age groups
    
    # Lifestyle preferences
    sleep_schedule = models.CharField(max_length=20, choices=SLEEP_SCHEDULE_CHOICES, default='flexible')
    cleanliness = models.CharField(max_length=20, choices=CLEANLINESS_CHOICES, default='moderate')
    noise_preference = models.CharField(max_length=20, choices=NOISE_CHOICES, default='moderate')
    smoking = models.CharField(max_length=20, choices=SMOKING_CHOICES, default='no_preference')
    
    # Interests for matching
    interests = models.JSONField(default=list)  # ['travel', 'reading', 'sports', etc.]
    languages = models.JSONField(default=list)  # ['English', 'Spanish', etc.]
    occupation = models.CharField(max_length=100, blank=True)
    
    # Additional info
    bio = models.TextField(blank=True, max_length=500)
    pets_allowed = models.BooleanField(default=False)
    has_pets = models.BooleanField(default=False)
    
    # Verification
    is_verified = models.BooleanField(default=False)
    verification_date = models.DateTimeField(null=True, blank=True)
    
    # Activity
    is_looking_for_roommate = models.BooleanField(default=True)
    last_active = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Roommate Profile: {self.user.email}"
    
    class Meta:
        ordering = ['-last_active']


class RoomPool(models.Model):
    """A pool/group for shared room booking"""
    
    POOL_STATUS_CHOICES = [
        ('open', 'Open - Accepting Members'),
        ('full', 'Full - No More Spots'),
        ('closed', 'Closed - Not Accepting'),
        ('booked', 'Booked - Reservation Made'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    VISIBILITY_CHOICES = [
        ('public', 'Public - Anyone can find and request'),
        ('private', 'Private - Invite only'),
        ('friends', 'Friends Only'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Pool details
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    property = models.ForeignKey(Property, related_name='room_pools', on_delete=models.CASCADE)
    
    # Creator/Host of the pool
    creator = models.ForeignKey(User, related_name='created_pools', on_delete=models.CASCADE)
    
    # Dates
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    
    # Capacity
    max_members = models.IntegerField(validators=[MinValueValidator(2), MaxValueValidator(20)])
    current_members = models.IntegerField(default=1)  # Creator is first member
    
    # Pricing
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_person = models.DecimalField(max_digits=10, decimal_places=2)
    booking_fee_per_person = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Settings
    status = models.CharField(max_length=20, choices=POOL_STATUS_CHOICES, default='open')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')
    
    # Requirements
    gender_preference = models.CharField(max_length=20, choices=RoommateProfile.GENDER_CHOICES, default='no_preference')
    min_age = models.IntegerField(null=True, blank=True)
    max_age = models.IntegerField(null=True, blank=True)
    smoking_allowed = models.BooleanField(default=False)
    pets_allowed = models.BooleanField(default=False)
    
    # Auto-matching preferences
    use_compatibility_matching = models.BooleanField(default=True)
    min_compatibility_score = models.IntegerField(default=50)  # 0-100
    
    # Linked reservation (once booked)
    reservation = models.OneToOneField(
        Reservation, 
        related_name='room_pool', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    # Timestamps
    booking_deadline = models.DateTimeField()  # Last date to join before booking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} - {self.property.title}"
    
    def spots_available(self):
        return self.max_members - self.current_members
    
    def is_full(self):
        return self.current_members >= self.max_members
    
    class Meta:
        ordering = ['-created_at']


class RoomPoolMember(models.Model):
    """Members in a room pool"""
    
    MEMBER_STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('left', 'Left Pool'),
        ('removed', 'Removed by Creator'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Payment Pending'),
        ('partial', 'Partially Paid'),
        ('paid', 'Fully Paid'),
        ('refunded', 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pool = models.ForeignKey(RoomPool, related_name='members', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='pool_memberships', on_delete=models.CASCADE)
    
    # Status
    status = models.CharField(max_length=20, choices=MEMBER_STATUS_CHOICES, default='pending')
    is_creator = models.BooleanField(default=False)
    
    # Compatibility score with pool
    compatibility_score = models.IntegerField(default=0)
    
    # Payment info
    share_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_due_date = models.DateTimeField(null=True, blank=True)
    
    # Custom split (if different from equal)
    custom_split_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Timestamps
    joined_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Request message
    request_message = models.TextField(blank=True, max_length=500)
    
    def __str__(self):
        return f"{self.user.email} in {self.pool.title}"
    
    class Meta:
        ordering = ['-joined_at']
        unique_together = ['pool', 'user']


class CostSplit(models.Model):
    """Detailed cost splitting for a room pool"""
    
    SPLIT_TYPE_CHOICES = [
        ('equal', 'Equal Split'),
        ('custom', 'Custom Percentages'),
        ('by_nights', 'Split by Nights Stayed'),
        ('by_beds', 'Split by Bed Allocation'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pool = models.OneToOneField(RoomPool, related_name='cost_split', on_delete=models.CASCADE)
    
    split_type = models.CharField(max_length=20, choices=SPLIT_TYPE_CHOICES, default='equal')
    
    # Breakdown
    base_accommodation = models.DecimalField(max_digits=10, decimal_places=2)
    cleaning_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    service_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    taxes = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Custom splits stored as JSON: {user_id: percentage}
    custom_percentages = models.JSONField(default=dict)
    
    # Individual amounts: {user_id: amount}
    individual_amounts = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Cost Split for {self.pool.title}"
    
    def calculate_equal_split(self):
        """Calculate equal split among members"""
        member_count = self.pool.members.filter(status='approved').count()
        if member_count > 0:
            per_person = self.total_amount / member_count
            members = self.pool.members.filter(status='approved')
            self.individual_amounts = {
                str(m.user.id): float(per_person) for m in members
            }
            self.save()
            return per_person
        return 0


class PoolChat(models.Model):
    """Chat messages between room pool members"""
    
    MESSAGE_TYPE_CHOICES = [
        ('text', 'Text Message'),
        ('system', 'System Message'),
        ('payment', 'Payment Update'),
        ('join', 'Member Joined'),
        ('leave', 'Member Left'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pool = models.ForeignKey(RoomPool, related_name='chat_messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name='pool_messages', on_delete=models.CASCADE, null=True, blank=True)
    
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES, default='text')
    message = models.TextField(max_length=1000)
    
    # For system messages
    metadata = models.JSONField(default=dict)
    
    is_read_by = models.JSONField(default=list)  # List of user IDs who read this
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Message in {self.pool.title}"
    
    class Meta:
        ordering = ['created_at']


class PoolInvitation(models.Model):
    """Invitations to join a private pool"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pool = models.ForeignKey(RoomPool, related_name='invitations', on_delete=models.CASCADE)
    
    # Can invite by email or existing user
    invited_user = models.ForeignKey(User, related_name='pool_invitations', on_delete=models.CASCADE, null=True, blank=True)
    invited_email = models.EmailField(blank=True)
    
    invited_by = models.ForeignKey(User, related_name='sent_pool_invitations', on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, max_length=500)
    
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        target = self.invited_user.email if self.invited_user else self.invited_email
        return f"Invitation to {target} for {self.pool.title}"
    
    class Meta:
        ordering = ['-created_at']


class PaymentTransaction(models.Model):
    """Track individual payment transactions for pool members"""
    
    TRANSACTION_TYPE_CHOICES = [
        ('payment', 'Payment'),
        ('refund', 'Refund'),
        ('adjustment', 'Adjustment'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pool_member = models.ForeignKey(RoomPoolMember, related_name='transactions', on_delete=models.CASCADE)
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES, default='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Payment details
    payment_method = models.CharField(max_length=50, blank=True)
    transaction_id = models.CharField(max_length=255, blank=True)  # External payment ID
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.transaction_type} - ${self.amount} for {self.pool_member.user.email}"
    
    class Meta:
        ordering = ['-created_at']

