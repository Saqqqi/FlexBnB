from rest_framework import serializers
from django.utils import timezone
from .models import (
    RoommateProfile, RoomPool, RoomPoolMember, CostSplit,
    PoolChat, PoolInvitation, PaymentTransaction
)
from property.serializers import PropertiesListSerializer
from useraccount.serializers import UserDetailSerializer


class RoommateProfileSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = RoommateProfile
        fields = [
            'id', 'user', 'user_name', 'user_email',
            'gender', 'preferred_gender', 'age_group', 'preferred_age_groups',
            'sleep_schedule', 'cleanliness', 'noise_preference', 'smoking',
            'interests', 'languages', 'occupation', 'bio',
            'pets_allowed', 'has_pets', 'is_verified', 'is_looking_for_roommate',
            'last_active', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'is_verified', 'created_at', 'last_active']


class RoommateProfileMatchSerializer(serializers.Serializer):
    """Serializer for roommate match results"""
    profile = RoommateProfileSerializer()
    compatibility_score = serializers.IntegerField()
    match_reasons = serializers.ListField(child=serializers.CharField())
    compatibility_breakdown = serializers.DictField()


class RoomPoolMemberSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomPoolMember
        fields = [
            'id', 'pool', 'user', 'user_name', 'user_email', 'user_avatar',
            'status', 'is_creator', 'compatibility_score',
            'share_amount', 'amount_paid', 'payment_status', 'payment_due_date',
            'custom_split_percentage', 'joined_at', 'approved_at', 'request_message'
        ]
        read_only_fields = ['id', 'pool', 'user', 'joined_at', 'compatibility_score']
    
    def get_user_avatar(self, obj):
        if obj.user.avatar:
            return obj.user.avatar.url
        return None


class CostSplitSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostSplit
        fields = [
            'id', 'pool', 'split_type',
            'base_accommodation', 'cleaning_fee', 'service_fee', 'taxes', 'total_amount',
            'custom_percentages', 'individual_amounts',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'pool', 'created_at', 'updated_at']


class PoolChatSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    sender_avatar = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()
    
    class Meta:
        model = PoolChat
        fields = [
            'id', 'pool', 'sender', 'sender_name', 'sender_avatar',
            'message_type', 'message', 'metadata', 'is_read_by',
            'created_at', 'is_mine'
        ]
        read_only_fields = ['id', 'pool', 'sender', 'created_at']
    
    def get_sender_avatar(self, obj):
        if obj.sender and obj.sender.avatar:
            return obj.sender.avatar.url
        return None
    
    def get_is_mine(self, obj):
        request = self.context.get('request')
        if request and obj.sender:
            return obj.sender.id == request.user.id
        return False


class RoomPoolListSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='property.title', read_only=True)
    property_image = serializers.SerializerMethodField()
    property_location = serializers.CharField(source='property.country', read_only=True)
    creator_name = serializers.CharField(source='creator.name', read_only=True)
    spots_available = serializers.IntegerField(read_only=True)
    days_until_deadline = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomPool
        fields = [
            'id', 'title', 'description', 'property', 'property_title', 
            'property_image', 'property_location',
            'creator', 'creator_name',
            'check_in_date', 'check_out_date',
            'max_members', 'current_members', 'spots_available',
            'total_price', 'price_per_person',
            'status', 'visibility', 'gender_preference',
            'booking_deadline', 'days_until_deadline',
            'created_at'
        ]
    
    def get_property_image(self, obj):
        if obj.property.image:
            return obj.property.image_url()
        return None
    
    def get_days_until_deadline(self, obj):
        if obj.booking_deadline:
            delta = obj.booking_deadline - timezone.now()
            return max(0, delta.days)
        return 0


class RoomPoolDetailSerializer(serializers.ModelSerializer):
    property_details = PropertiesListSerializer(source='property', read_only=True)
    creator_name = serializers.CharField(source='creator.name', read_only=True)
    members = RoomPoolMemberSerializer(many=True, read_only=True)
    cost_split = CostSplitSerializer(read_only=True)
    spots_available = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    is_creator = serializers.SerializerMethodField()
    my_membership = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomPool
        fields = [
            'id', 'title', 'description', 'property', 'property_details',
            'creator', 'creator_name',
            'check_in_date', 'check_out_date',
            'max_members', 'current_members', 'spots_available',
            'total_price', 'price_per_person', 'booking_fee_per_person',
            'status', 'visibility',
            'gender_preference', 'min_age', 'max_age',
            'smoking_allowed', 'pets_allowed',
            'use_compatibility_matching', 'min_compatibility_score',
            'reservation', 'booking_deadline',
            'members', 'cost_split',
            'is_member', 'is_creator', 'my_membership',
            'created_at', 'updated_at'
        ]
    
    def get_spots_available(self, obj):
        return obj.spots_available()
    
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(user=request.user, status='approved').exists()
        return False
    
    def get_is_creator(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.creator.id == request.user.id
        return False
    
    def get_my_membership(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.members.filter(user=request.user).first()
            if membership:
                return RoomPoolMemberSerializer(membership).data
        return None


class CreateRoomPoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomPool
        fields = [
            'title', 'description', 'property',
            'check_in_date', 'check_out_date',
            'max_members', 'total_price',
            'visibility', 'gender_preference',
            'min_age', 'max_age', 'smoking_allowed', 'pets_allowed',
            'use_compatibility_matching', 'min_compatibility_score',
            'booking_deadline'
        ]
    
    def validate(self, data):
        property_obj = data.get('property')
        max_members = data.get('max_members')
        
        # Check if property allows room pooling
        if not property_obj.allow_room_pooling:
            raise serializers.ValidationError({
                'property': 'This property does not allow room pooling. The host has not enabled this feature.'
            })
        
        # Check max pool members limit set by property owner
        if property_obj.max_pool_members and max_members > property_obj.max_pool_members:
            raise serializers.ValidationError({
                'max_members': f'This property allows a maximum of {property_obj.max_pool_members} members per pool.'
            })
        
        return data
    
    def create(self, validated_data):
        from decimal import Decimal
        
        user = self.context['request'].user
        total_price = validated_data['total_price']
        max_members = validated_data['max_members']
        
        # Calculate price per person
        price_per_person = total_price / Decimal(max_members)
        booking_fee_per_person = price_per_person * Decimal('0.1')  # 10% booking fee
        
        pool = RoomPool.objects.create(
            creator=user,
            price_per_person=price_per_person,
            booking_fee_per_person=booking_fee_per_person,
            **validated_data
        )
        
        # Add creator as first member
        RoomPoolMember.objects.create(
            pool=pool,
            user=user,
            status='approved',
            is_creator=True,
            share_amount=price_per_person + booking_fee_per_person,
            compatibility_score=100
        )
        
        # Create cost split
        CostSplit.objects.create(
            pool=pool,
            base_accommodation=total_price,
            total_amount=total_price + (booking_fee_per_person * Decimal(max_members)),
            individual_amounts={str(user.id): float(price_per_person + booking_fee_per_person)}
        )
        
        return pool


class JoinPoolRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=500, required=False, allow_blank=True)


class PoolInvitationSerializer(serializers.ModelSerializer):
    pool_title = serializers.CharField(source='pool.title', read_only=True)
    invited_by_name = serializers.CharField(source='invited_by.name', read_only=True)
    
    class Meta:
        model = PoolInvitation
        fields = [
            'id', 'pool', 'pool_title',
            'invited_user', 'invited_email',
            'invited_by', 'invited_by_name',
            'status', 'message', 'expires_at', 'created_at'
        ]
        read_only_fields = ['id', 'pool', 'invited_by', 'created_at']


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'pool_member', 'transaction_type', 'amount', 'status',
            'payment_method', 'transaction_id', 'notes',
            'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at']


class CostSplitCalculatorSerializer(serializers.Serializer):
    """Serializer for calculating cost splits"""
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    member_count = serializers.IntegerField(min_value=2)
    split_type = serializers.ChoiceField(choices=['equal', 'custom', 'by_nights'])
    custom_percentages = serializers.DictField(required=False)
    nights_per_member = serializers.DictField(required=False)
    
    def calculate(self):
        data = self.validated_data
        total = float(data['total_amount'])
        members = data['member_count']
        split_type = data['split_type']
        
        if split_type == 'equal':
            per_person = total / members
            return {
                'per_person': round(per_person, 2),
                'total': total,
                'split_type': 'equal'
            }
        
        elif split_type == 'custom':
            percentages = data.get('custom_percentages', {})
            result = {}
            for user_id, percentage in percentages.items():
                result[user_id] = round(total * (float(percentage) / 100), 2)
            return {
                'individual_amounts': result,
                'total': total,
                'split_type': 'custom'
            }
        
        elif split_type == 'by_nights':
            nights = data.get('nights_per_member', {})
            total_nights = sum(nights.values())
            result = {}
            for user_id, user_nights in nights.items():
                result[user_id] = round(total * (user_nights / total_nights), 2)
            return {
                'individual_amounts': result,
                'total': total,
                'split_type': 'by_nights'
            }
        
        return {}

