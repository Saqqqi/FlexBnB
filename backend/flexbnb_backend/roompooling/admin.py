from django.contrib import admin
from .models import (
    RoommateProfile, RoomPool, RoomPoolMember, CostSplit,
    PoolChat, PoolInvitation, PaymentTransaction
)


@admin.register(RoommateProfile)
class RoommateProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'gender', 'sleep_schedule', 'cleanliness', 'is_looking_for_roommate', 'is_verified']
    list_filter = ['gender', 'sleep_schedule', 'cleanliness', 'is_looking_for_roommate', 'is_verified']
    search_fields = ['user__email', 'user__name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_active']


class RoomPoolMemberInline(admin.TabularInline):
    model = RoomPoolMember
    extra = 0
    readonly_fields = ['id', 'joined_at', 'approved_at', 'compatibility_score']


@admin.register(RoomPool)
class RoomPoolAdmin(admin.ModelAdmin):
    list_display = ['title', 'property', 'creator', 'status', 'visibility', 'current_members', 'max_members', 'price_per_person']
    list_filter = ['status', 'visibility', 'gender_preference', 'smoking_allowed', 'pets_allowed']
    search_fields = ['title', 'property__title', 'creator__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines = [RoomPoolMemberInline]
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'description', 'property', 'creator', 'status', 'visibility')
        }),
        ('Dates', {
            'fields': ('check_in_date', 'check_out_date', 'booking_deadline')
        }),
        ('Capacity & Pricing', {
            'fields': ('max_members', 'current_members', 'total_price', 'price_per_person', 'booking_fee_per_person')
        }),
        ('Requirements', {
            'fields': ('gender_preference', 'min_age', 'max_age', 'smoking_allowed', 'pets_allowed')
        }),
        ('Matching', {
            'fields': ('use_compatibility_matching', 'min_compatibility_score')
        }),
        ('Reservation', {
            'fields': ('reservation',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(RoomPoolMember)
class RoomPoolMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'pool', 'status', 'is_creator', 'compatibility_score', 'share_amount', 'payment_status']
    list_filter = ['status', 'is_creator', 'payment_status']
    search_fields = ['user__email', 'pool__title']
    readonly_fields = ['id', 'joined_at', 'approved_at']


@admin.register(CostSplit)
class CostSplitAdmin(admin.ModelAdmin):
    list_display = ['pool', 'split_type', 'total_amount', 'base_accommodation']
    list_filter = ['split_type']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(PoolChat)
class PoolChatAdmin(admin.ModelAdmin):
    list_display = ['pool', 'sender', 'message_type', 'message', 'created_at']
    list_filter = ['message_type', 'created_at']
    search_fields = ['pool__title', 'sender__email', 'message']
    readonly_fields = ['id', 'created_at']


@admin.register(PoolInvitation)
class PoolInvitationAdmin(admin.ModelAdmin):
    list_display = ['pool', 'invited_email', 'invited_user', 'invited_by', 'status', 'expires_at']
    list_filter = ['status']
    search_fields = ['pool__title', 'invited_email', 'invited_user__email']
    readonly_fields = ['id', 'created_at']


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['pool_member', 'transaction_type', 'amount', 'status', 'created_at']
    list_filter = ['transaction_type', 'status']
    readonly_fields = ['id', 'created_at']

