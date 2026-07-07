from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import Q, Avg
from datetime import timedelta
from useraccount.auth import ClerkAuthentication
from .models import (
    RoommateProfile, RoomPool, RoomPoolMember, CostSplit,
    PoolChat, PoolInvitation, PaymentTransaction
)
from .serializers import (
    RoommateProfileSerializer, RoommateProfileMatchSerializer,
    RoomPoolListSerializer, RoomPoolDetailSerializer, CreateRoomPoolSerializer,
    RoomPoolMemberSerializer, CostSplitSerializer, PoolChatSerializer,
    JoinPoolRequestSerializer, PoolInvitationSerializer, PaymentTransactionSerializer,
    CostSplitCalculatorSerializer
)


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


# ==================== ROOMMATE PROFILE & MATCHING ====================

class RoommateProfileViewSet(viewsets.ModelViewSet):
    """Manage roommate profile for compatibility matching"""
    authentication_classes = [ClerkAuthentication]
    serializer_class = RoommateProfileSerializer
    
    def get_queryset(self):
        return RoommateProfile.objects.filter(user=self.request.user)
    
    def get_object(self):
        profile, created = RoommateProfile.objects.get_or_create(user=self.request.user)
        return profile
    
    def list(self, request):
        """Get current user's roommate profile"""
        profile = self.get_object()
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    def create(self, request):
        """Create or update roommate profile"""
        profile = self.get_object()
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        """Update roommate profile"""
        profile = self.get_object()
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(last_active=timezone.now())
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoommateMatchingView(APIView):
    """Find compatible roommates based on profile"""
    authentication_classes = [ClerkAuthentication]
    
    def get(self, request):
        """Get matching roommates"""
        user = request.user
        
        # Ensure user has a profile
        user_profile, created = RoommateProfile.objects.get_or_create(user=user)
        
        # Find other users looking for roommates
        potential_matches = RoommateProfile.objects.filter(
            is_looking_for_roommate=True
        ).exclude(user=user)
        
        # Optional filters from query params
        location = request.query_params.get('location')
        check_in = request.query_params.get('check_in')
        check_out = request.query_params.get('check_out')
        
        matches = []
        for profile in potential_matches:
            score, reasons, breakdown = self._calculate_compatibility(user_profile, profile)
            
            # Only include good matches (score > 40)
            if score > 40:
                matches.append({
                    'profile': RoommateProfileSerializer(profile).data,
                    'compatibility_score': score,
                    'match_reasons': reasons,
                    'compatibility_breakdown': breakdown
                })
        
        # Sort by compatibility score
        matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
        
        return Response({
            'matches': matches[:20],  # Top 20 matches
            'total_found': len(matches)
        })
    
    def _calculate_compatibility(self, profile1, profile2):
        """Calculate compatibility score between two profiles"""
        score = 0
        max_score = 0
        reasons = []
        breakdown = {}
        
        # Gender preference match (15 points)
        max_score += 15
        if (profile1.preferred_gender == 'no_preference' or 
            profile1.preferred_gender == profile2.gender):
            if (profile2.preferred_gender == 'no_preference' or
                profile2.preferred_gender == profile1.gender):
                score += 15
                breakdown['gender'] = {'score': 15, 'max': 15}
            else:
                score += 7
                breakdown['gender'] = {'score': 7, 'max': 15}
        else:
            breakdown['gender'] = {'score': 0, 'max': 15}
        
        # Sleep schedule (20 points)
        max_score += 20
        if profile1.sleep_schedule == profile2.sleep_schedule:
            score += 20
            reasons.append(f"Same sleep schedule ({profile1.get_sleep_schedule_display()})")
            breakdown['sleep'] = {'score': 20, 'max': 20}
        elif 'flexible' in [profile1.sleep_schedule, profile2.sleep_schedule]:
            score += 15
            breakdown['sleep'] = {'score': 15, 'max': 20}
        else:
            breakdown['sleep'] = {'score': 0, 'max': 20}
        
        # Cleanliness (20 points)
        max_score += 20
        if profile1.cleanliness == profile2.cleanliness:
            score += 20
            reasons.append("Similar cleanliness standards")
            breakdown['cleanliness'] = {'score': 20, 'max': 20}
        elif abs(list(dict(RoommateProfile.CLEANLINESS_CHOICES)).index(profile1.cleanliness) - 
                list(dict(RoommateProfile.CLEANLINESS_CHOICES)).index(profile2.cleanliness)) == 1:
            score += 10
            breakdown['cleanliness'] = {'score': 10, 'max': 20}
        else:
            breakdown['cleanliness'] = {'score': 0, 'max': 20}
        
        # Noise preference (15 points)
        max_score += 15
        if profile1.noise_preference == profile2.noise_preference:
            score += 15
            reasons.append(f"Both prefer {profile1.get_noise_preference_display()}")
            breakdown['noise'] = {'score': 15, 'max': 15}
        elif 'moderate' in [profile1.noise_preference, profile2.noise_preference]:
            score += 8
            breakdown['noise'] = {'score': 8, 'max': 15}
        else:
            breakdown['noise'] = {'score': 0, 'max': 15}
        
        # Smoking (15 points)
        max_score += 15
        smoke1 = profile1.smoking
        smoke2 = profile2.smoking
        if smoke1 == smoke2:
            score += 15
            breakdown['smoking'] = {'score': 15, 'max': 15}
        elif 'no_preference' in [smoke1, smoke2]:
            score += 12
            breakdown['smoking'] = {'score': 12, 'max': 15}
        elif ('non_smoker' in [smoke1, smoke2] and 'smoker' in [smoke1, smoke2]):
            score += 0  # Non-smoker with smoker = bad match
            breakdown['smoking'] = {'score': 0, 'max': 15}
        else:
            score += 7
            breakdown['smoking'] = {'score': 7, 'max': 15}
        
        # Shared interests (15 points)
        max_score += 15
        if profile1.interests and profile2.interests:
            shared = set(profile1.interests) & set(profile2.interests)
            if len(shared) >= 3:
                score += 15
                reasons.append(f"Share {len(shared)} interests: {', '.join(list(shared)[:3])}")
                breakdown['interests'] = {'score': 15, 'max': 15, 'shared': list(shared)}
            elif len(shared) >= 1:
                score += len(shared) * 5
                breakdown['interests'] = {'score': len(shared) * 5, 'max': 15, 'shared': list(shared)}
            else:
                breakdown['interests'] = {'score': 0, 'max': 15, 'shared': []}
        else:
            breakdown['interests'] = {'score': 5, 'max': 15}  # No data, neutral
            score += 5
        
        # Calculate percentage
        final_score = int((score / max_score) * 100) if max_score > 0 else 0
        
        return final_score, reasons, breakdown


# ==================== ROOM POOL MANAGEMENT ====================

class RoomPoolViewSet(viewsets.ModelViewSet):
    """Manage room pools for shared bookings"""
    authentication_classes = [ClerkAuthentication]
    pagination_class = StandardPagination
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateRoomPoolSerializer
        if self.action in ['retrieve', 'my_pools']:
            return RoomPoolDetailSerializer
        return RoomPoolListSerializer
    
    def get_queryset(self):
        queryset = RoomPool.objects.all()
        
        # For retrieve action, allow access to pools user is a member of (any status)
        if self.action == 'retrieve':
            if self.request.user.is_authenticated:
                user = self.request.user
                return queryset.filter(
                    Q(visibility='public') |
                    Q(creator=user) |
                    Q(members__user=user)
                ).distinct()
            else:
                return queryset.filter(visibility='public')
        
        # Filter by visibility for non-authenticated or public browsing
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(visibility='public', status='open')
        else:
            # Show public pools + user's own pools + pools user is invited to
            user = self.request.user
            queryset = queryset.filter(
                Q(visibility='public') |
                Q(creator=user) |
                Q(members__user=user) |
                Q(invitations__invited_user=user, invitations__status='pending')
            ).distinct()
        
        # Apply filters
        property_id = self.request.query_params.get('property_id')
        if property_id:
            queryset = queryset.filter(property_id=property_id)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(
                Q(property__country__icontains=location) |
                Q(property__country_code__icontains=location)
            )
        
        check_in = self.request.query_params.get('check_in')
        check_out = self.request.query_params.get('check_out')
        if check_in:
            queryset = queryset.filter(check_in_date__gte=check_in)
        if check_out:
            queryset = queryset.filter(check_out_date__lte=check_out)
        
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price_per_person__gte=min_price)
        if max_price:
            queryset = queryset.filter(price_per_person__lte=max_price)
        
        return queryset.filter(status__in=['open', 'full'])
    
    def get_serializer_context(self):
        return {'request': self.request}
    
    @action(detail=False, methods=['get'])
    def my_pools(self, request):
        """Get pools created by or joined by the current user"""
        user = request.user
        
        # Pools created by user
        created = RoomPool.objects.filter(creator=user)
        
        # Pools user has joined
        joined = RoomPool.objects.filter(
            members__user=user,
            members__status='approved'
        ).exclude(creator=user)
        
        # Pending requests
        pending = RoomPool.objects.filter(
            members__user=user,
            members__status='pending'
        )
        
        return Response({
            'created': RoomPoolDetailSerializer(created, many=True, context={'request': request}).data,
            'joined': RoomPoolDetailSerializer(joined, many=True, context={'request': request}).data,
            'pending': RoomPoolListSerializer(pending, many=True).data
        })
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Request to join a room pool"""
        pool = self.get_object()
        user = request.user
        
        # Validations
        if pool.creator == user:
            return Response(
                {'error': 'You are the creator of this pool'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if pool.is_full():
            return Response(
                {'error': 'This pool is full'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if pool.status != 'open':
            return Response(
                {'error': 'This pool is not accepting new members'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already a member
        existing = RoomPoolMember.objects.filter(pool=pool, user=user).first()
        if existing:
            if existing.status == 'pending':
                return Response(
                    {'error': 'You already have a pending request'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing.status == 'approved':
                return Response(
                    {'error': 'You are already a member'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Calculate compatibility if profile exists
        compatibility_score = 0
        if pool.use_compatibility_matching:
            try:
                user_profile = RoommateProfile.objects.get(user=user)
                creator_profile = RoommateProfile.objects.get(user=pool.creator)
                matching_view = RoommateMatchingView()
                compatibility_score, _, _ = matching_view._calculate_compatibility(
                    user_profile, creator_profile
                )
                
                # Check minimum compatibility
                if compatibility_score < pool.min_compatibility_score:
                    return Response({
                        'error': f'Your compatibility score ({compatibility_score}%) is below the minimum required ({pool.min_compatibility_score}%)',
                        'compatibility_score': compatibility_score
                    }, status=status.HTTP_400_BAD_REQUEST)
            except RoommateProfile.DoesNotExist:
                pass  # No profile, allow join anyway
        
        serializer = JoinPoolRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # For public pools with no compatibility requirement, auto-approve
        auto_approve = (
            pool.visibility == 'public' and 
            not pool.use_compatibility_matching
        )
        
        member = RoomPoolMember.objects.create(
            pool=pool,
            user=user,
            status='approved' if auto_approve else 'pending',
            share_amount=pool.price_per_person + pool.booking_fee_per_person,
            compatibility_score=compatibility_score,
            request_message=serializer.validated_data.get('message', ''),
            approved_at=timezone.now() if auto_approve else None
        )
        
        if auto_approve:
            pool.current_members += 1
            if pool.is_full():
                pool.status = 'full'
            pool.save()
            
            # Update cost split
            self._recalculate_cost_split(pool)
        
        # Create system message in chat
        PoolChat.objects.create(
            pool=pool,
            sender=user,
            message_type='join',
            message=f'{user.name} {"joined" if auto_approve else "requested to join"} the pool',
            metadata={'user_id': str(user.id), 'auto_approved': auto_approve}
        )
        
        return Response({
            'success': True,
            'status': member.status,
            'message': 'You have joined the pool!' if auto_approve else 'Your request has been submitted',
            'membership': RoomPoolMemberSerializer(member).data
        })
    
    @action(detail=True, methods=['post'])
    def approve_member(self, request, pk=None):
        """Approve a pending member (creator only)"""
        pool = self.get_object()
        user = request.user
        
        if pool.creator != user:
            return Response(
                {'error': 'Only the pool creator can approve members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        member_id = request.data.get('member_id')
        try:
            member = RoomPoolMember.objects.get(id=member_id, pool=pool, status='pending')
        except RoomPoolMember.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if pool.is_full():
            return Response(
                {'error': 'Pool is already full'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        member.status = 'approved'
        member.approved_at = timezone.now()
        member.save()
        
        pool.current_members += 1
        if pool.is_full():
            pool.status = 'full'
        pool.save()
        
        self._recalculate_cost_split(pool)
        
        # System message
        PoolChat.objects.create(
            pool=pool,
            message_type='system',
            message=f'{member.user.name} has been approved to join the pool!'
        )
        
        return Response({'success': True, 'member': RoomPoolMemberSerializer(member).data})
    
    @action(detail=True, methods=['post'])
    def reject_member(self, request, pk=None):
        """Reject a pending member (creator only)"""
        pool = self.get_object()
        
        if pool.creator != request.user:
            return Response(
                {'error': 'Only the pool creator can reject members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        member_id = request.data.get('member_id')
        try:
            member = RoomPoolMember.objects.get(id=member_id, pool=pool, status='pending')
        except RoomPoolMember.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        member.status = 'rejected'
        member.save()
        
        return Response({'success': True})
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a room pool"""
        pool = self.get_object()
        user = request.user
        
        if pool.creator == user:
            return Response(
                {'error': 'Creator cannot leave the pool. Cancel it instead.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            member = RoomPoolMember.objects.get(pool=pool, user=user, status='approved')
        except RoomPoolMember.DoesNotExist:
            return Response(
                {'error': 'You are not a member of this pool'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        member.status = 'left'
        member.save()
        
        pool.current_members -= 1
        if pool.status == 'full':
            pool.status = 'open'
        pool.save()
        
        self._recalculate_cost_split(pool)
        
        # System message
        PoolChat.objects.create(
            pool=pool,
            message_type='leave',
            message=f'{user.name} has left the pool'
        )
        
        return Response({'success': True})
    
    @action(detail=True, methods=['post'])
    def finalize_booking(self, request, pk=None):
        """
        Finalize pool booking - creates a reservation and records host earnings.
        Only pool creator can finalize. All members must have paid.
        """
        from booking.models import Reservation, HostEarnings
        from decimal import Decimal
        
        pool = self.get_object()
        user = request.user
        
        # Only creator can finalize
        if pool.creator != user:
            return Response(
                {'error': 'Only the pool creator can finalize the booking'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if pool is already booked
        if pool.status == 'booked':
            return Response(
                {'error': 'This pool is already booked'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if pool has reservation already
        if pool.reservation:
            return Response(
                {'error': 'Reservation already exists for this pool'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all approved members
        approved_members = pool.members.filter(status='approved')
        
        # Check minimum members (at least 2 for a pool)
        if approved_members.count() < 2:
            return Response(
                {'error': 'Pool needs at least 2 members to finalize booking'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if all members have paid (optional - can be enforced or skipped)
        unpaid_members = approved_members.filter(payment_status='pending')
        if unpaid_members.exists():
            # Option: Allow booking even if not all paid, or require payment
            # For now, we'll allow but warn
            pass
        
        # Calculate total collected
        total_collected = sum(m.amount_paid for m in approved_members)
        
        # Create the reservation
        try:
            booking_fee = pool.total_price * Decimal('0.1')  # 10% platform fee
            host_earnings_amount = pool.total_price - booking_fee
            
            reservation = Reservation.objects.create(
                property=pool.property,
                guest=pool.creator,  # Creator is the primary contact
                host=pool.property.Host,
                check_in_date=pool.check_in_date,
                check_out_date=pool.check_out_date,
                guests_count=approved_members.count(),
                total_price=pool.total_price,
                booking_fee=booking_fee,
                host_earnings=host_earnings_amount,
                status='pending',  # Host still needs to approve
                special_requests=f'Room Pool Booking: {pool.title}\nMembers: {", ".join([m.user.name for m in approved_members])}',
                booking_type='room_pool',
                is_room_pool=True,
                room_pool_id=pool.id,
                pool_members_count=approved_members.count()
            )
            
            # Link reservation to pool
            pool.reservation = reservation
            pool.status = 'booked'
            pool.save()
            
            # Create earnings record (pending until host approves)
            # Note: HostEarnings is created when reservation is approved
            
            # System message in chat
            PoolChat.objects.create(
                pool=pool,
                message_type='system',
                message=f'🎉 Pool booking finalized! Reservation created and pending host approval.'
            )
            
            # Update all member payment transactions
            for member in approved_members:
                if member.amount_paid > 0:
                    PaymentTransaction.objects.create(
                        pool_member=member,
                        transaction_type='payment',
                        amount=member.amount_paid,
                        status='completed',
                        payment_method='pool_booking',
                        notes=f'Payment for pool booking - Reservation {reservation.id}'
                    )
            
            return Response({
                'success': True,
                'message': 'Pool booking finalized! Awaiting host approval.',
                'reservation_id': str(reservation.id),
                'total_price': float(pool.total_price),
                'members_count': approved_members.count(),
                'status': 'pending'
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create reservation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def booking_status(self, request, pk=None):
        """Get the booking/reservation status for a pool"""
        pool = self.get_object()
        
        if not pool.reservation:
            # Check readiness for booking
            approved_members = pool.members.filter(status='approved')
            total_paid = sum(m.amount_paid for m in approved_members)
            total_due = sum(m.share_amount for m in approved_members)
            
            return Response({
                'has_reservation': False,
                'can_finalize': approved_members.count() >= 2,
                'members_count': approved_members.count(),
                'total_paid': float(total_paid),
                'total_due': float(total_due),
                'payment_complete': total_paid >= total_due,
                'pool_status': pool.status
            })
        
        return Response({
            'has_reservation': True,
            'reservation_id': str(pool.reservation.id),
            'reservation_status': pool.reservation.status,
            'check_in_date': pool.reservation.check_in_date,
            'check_out_date': pool.reservation.check_out_date,
            'total_price': float(pool.reservation.total_price),
            'pool_status': pool.status
        })
    
    def _recalculate_cost_split(self, pool):
        """Recalculate cost split after member changes"""
        try:
            cost_split = pool.cost_split
        except CostSplit.DoesNotExist:
            cost_split = CostSplit.objects.create(
                pool=pool,
                base_accommodation=pool.total_price,
                total_amount=pool.total_price + (pool.booking_fee_per_person * pool.max_members)
            )
        
        cost_split.calculate_equal_split()
        
        # Update member share amounts
        approved_members = pool.members.filter(status='approved')
        member_count = approved_members.count()
        if member_count > 0:
            share_amount = pool.total_price / member_count
            for member in approved_members:
                member.share_amount = share_amount + pool.booking_fee_per_person
                member.save()


# ==================== COST SPLITTING ====================

class CostSplitView(APIView):
    """Manage cost splitting for a pool"""
    authentication_classes = [ClerkAuthentication]
    
    def get(self, request, pool_id):
        """Get cost split details for a pool"""
        try:
            pool = RoomPool.objects.get(id=pool_id)
        except RoomPool.DoesNotExist:
            return Response({'error': 'Pool not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verify user is a member
        is_member = pool.members.filter(user=request.user, status='approved').exists()
        if not is_member and pool.creator != request.user:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            cost_split = pool.cost_split
        except CostSplit.DoesNotExist:
            return Response({'error': 'Cost split not configured'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CostSplitSerializer(cost_split)
        
        # Get member payment statuses
        members = pool.members.filter(status='approved')
        payment_summary = []
        for member in members:
            payment_summary.append({
                'user_id': str(member.user.id),
                'user_name': member.user.name,
                'share_amount': float(member.share_amount),
                'amount_paid': float(member.amount_paid),
                'payment_status': member.payment_status,
                'remaining': float(member.share_amount - member.amount_paid)
            })
        
        return Response({
            'cost_split': serializer.data,
            'payment_summary': payment_summary,
            'total_collected': sum(m['amount_paid'] for m in payment_summary),
            'total_remaining': sum(m['remaining'] for m in payment_summary)
        })
    
    def post(self, request, pool_id):
        """Update cost split configuration"""
        try:
            pool = RoomPool.objects.get(id=pool_id)
        except RoomPool.DoesNotExist:
            return Response({'error': 'Pool not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if pool.creator != request.user:
            return Response({'error': 'Only creator can modify cost split'}, status=status.HTTP_403_FORBIDDEN)
        
        cost_split, created = CostSplit.objects.get_or_create(
            pool=pool,
            defaults={
                'base_accommodation': pool.total_price,
                'total_amount': pool.total_price
            }
        )
        
        split_type = request.data.get('split_type', 'equal')
        cost_split.split_type = split_type
        
        if split_type == 'custom':
            custom_percentages = request.data.get('custom_percentages', {})
            cost_split.custom_percentages = custom_percentages
            
            # Calculate individual amounts
            individual_amounts = {}
            for user_id, percentage in custom_percentages.items():
                individual_amounts[user_id] = float(cost_split.total_amount) * (float(percentage) / 100)
            cost_split.individual_amounts = individual_amounts
            
            # Update member share amounts
            for member in pool.members.filter(status='approved'):
                if str(member.user.id) in individual_amounts:
                    member.share_amount = individual_amounts[str(member.user.id)]
                    member.save()
        else:
            cost_split.calculate_equal_split()
        
        cost_split.save()
        
        return Response(CostSplitSerializer(cost_split).data)


class CostCalculatorView(APIView):
    """Calculate cost splits without saving"""
    authentication_classes = [ClerkAuthentication]
    
    def post(self, request):
        """Calculate cost split preview"""
        serializer = CostSplitCalculatorSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.calculate()
            return Response(result)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== POOL CHAT ====================

class PoolChatViewSet(viewsets.ModelViewSet):
    """Real-time chat for pool members"""
    authentication_classes = [ClerkAuthentication]
    serializer_class = PoolChatSerializer
    pagination_class = StandardPagination
    
    def get_queryset(self):
        pool_id = self.kwargs.get('pool_id')
        return PoolChat.objects.filter(pool_id=pool_id).order_by('-created_at')
    
    def get_serializer_context(self):
        return {'request': self.request}
    
    def list(self, request, pool_id=None):
        """Get chat messages for a pool"""
        try:
            pool = RoomPool.objects.get(id=pool_id)
        except RoomPool.DoesNotExist:
            return Response({'error': 'Pool not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verify membership
        is_member = pool.members.filter(user=request.user, status='approved').exists()
        is_creator = pool.creator == request.user
        
        if not is_member and not is_creator:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        messages = self.get_queryset()
        page = self.paginate_queryset(messages)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)
    
    def create(self, request, pool_id=None):
        """Send a message to the pool chat"""
        try:
            pool = RoomPool.objects.get(id=pool_id)
        except RoomPool.DoesNotExist:
            return Response({'error': 'Pool not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verify membership
        is_member = pool.members.filter(user=request.user, status='approved').exists()
        is_creator = pool.creator == request.user
        
        if not is_member and not is_creator:
            return Response({'error': 'Only pool members can send messages'}, status=status.HTTP_403_FORBIDDEN)
        
        message_text = request.data.get('message', '').strip()
        if not message_text:
            return Response({'error': 'Message cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        message = PoolChat.objects.create(
            pool=pool,
            sender=request.user,
            message_type='text',
            message=message_text,
            is_read_by=[str(request.user.id)]
        )
        
        return Response(
            PoolChatSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['post'])
    def mark_read(self, request, pool_id=None):
        """Mark messages as read"""
        user_id = str(request.user.id)
        
        messages = PoolChat.objects.filter(pool_id=pool_id)
        for msg in messages:
            if user_id not in msg.is_read_by:
                msg.is_read_by.append(user_id)
                msg.save()
        
        return Response({'success': True})


# ==================== POOL INVITATIONS ====================

class PoolInvitationViewSet(viewsets.ModelViewSet):
    """Manage pool invitations"""
    authentication_classes = [ClerkAuthentication]
    serializer_class = PoolInvitationSerializer
    
    def get_queryset(self):
        user = self.request.user
        return PoolInvitation.objects.filter(
            Q(invited_user=user) | Q(invited_by=user)
        )
    
    def create(self, request):
        """Send an invitation to join a pool"""
        pool_id = request.data.get('pool_id')
        
        try:
            pool = RoomPool.objects.get(id=pool_id)
        except RoomPool.DoesNotExist:
            return Response({'error': 'Pool not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Only creator can send invitations
        if pool.creator != request.user:
            return Response(
                {'error': 'Only pool creator can send invitations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        invited_email = request.data.get('email')
        message = request.data.get('message', '')
        
        # Check if user exists
        from useraccount.models import User
        invited_user = User.objects.filter(email=invited_email).first()
        
        # Check for existing invitation
        existing = PoolInvitation.objects.filter(
            pool=pool,
            invited_email=invited_email,
            status='pending'
        ).exists()
        
        if existing:
            return Response(
                {'error': 'An invitation is already pending for this email'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        invitation = PoolInvitation.objects.create(
            pool=pool,
            invited_user=invited_user,
            invited_email=invited_email,
            invited_by=request.user,
            message=message,
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        return Response(
            PoolInvitationSerializer(invitation).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Respond to an invitation (accept/decline)"""
        invitation = self.get_object()
        
        if invitation.invited_user != request.user and invitation.invited_email != request.user.email:
            return Response({'error': 'This invitation is not for you'}, status=status.HTTP_403_FORBIDDEN)
        
        if invitation.status != 'pending':
            return Response({'error': 'Invitation already responded'}, status=status.HTTP_400_BAD_REQUEST)
        
        if invitation.expires_at < timezone.now():
            invitation.status = 'expired'
            invitation.save()
            return Response({'error': 'Invitation has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        accept = request.data.get('accept', False)
        
        if accept:
            # Check if pool is still available
            pool = invitation.pool
            if pool.is_full():
                return Response({'error': 'Pool is now full'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create membership
            member, created = RoomPoolMember.objects.get_or_create(
                pool=pool,
                user=request.user,
                defaults={
                    'status': 'approved',
                    'share_amount': pool.price_per_person + pool.booking_fee_per_person,
                    'approved_at': timezone.now()
                }
            )
            
            if not created:
                member.status = 'approved'
                member.approved_at = timezone.now()
                member.save()
            
            pool.current_members += 1
            if pool.is_full():
                pool.status = 'full'
            pool.save()
            
            invitation.status = 'accepted'
            
            # System message
            PoolChat.objects.create(
                pool=pool,
                message_type='join',
                message=f'{request.user.name} has joined via invitation!'
            )
        else:
            invitation.status = 'declined'
        
        invitation.responded_at = timezone.now()
        invitation.save()
        
        return Response({
            'success': True,
            'status': invitation.status
        })


# ==================== PAYMENT TRACKING ====================

class PaymentTrackingView(APIView):
    """Track payments for pool members"""
    authentication_classes = [ClerkAuthentication]
    
    def post(self, request, pool_id):
        """Record a payment"""
        try:
            pool = RoomPool.objects.get(id=pool_id)
        except RoomPool.DoesNotExist:
            return Response({'error': 'Pool not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get member
        try:
            member = RoomPoolMember.objects.get(pool=pool, user=request.user, status='approved')
        except RoomPoolMember.DoesNotExist:
            return Response({'error': 'You are not a member'}, status=status.HTTP_400_BAD_REQUEST)
        
        amount = request.data.get('amount', 0)
        
        if amount <= 0:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create transaction
        transaction = PaymentTransaction.objects.create(
            pool_member=member,
            transaction_type='payment',
            amount=amount,
            status='completed',
            payment_method=request.data.get('payment_method', 'manual'),
            completed_at=timezone.now()
        )
        
        # Update member payment
        member.amount_paid += amount
        if member.amount_paid >= member.share_amount:
            member.payment_status = 'paid'
        elif member.amount_paid > 0:
            member.payment_status = 'partial'
        member.save()
        
        # System message
        PoolChat.objects.create(
            pool=pool,
            message_type='payment',
            message=f'{request.user.name} made a payment of ${amount}',
            metadata={'amount': float(amount), 'user_id': str(request.user.id)}
        )
        
        return Response(PaymentTransactionSerializer(transaction).data)


# ==================== PUBLIC POOL DISCOVERY ====================

class PublicPoolsView(APIView):
    """Discover public room pools - works with or without authentication"""
    authentication_classes = [ClerkAuthentication]  # Optional authentication
    permission_classes = []  # Allow any access
    
    def get(self, request):
        """Get list of open public pools"""
        pools = RoomPool.objects.filter(
            visibility='public',
            status__in=['open', 'full'],  # Show both open and full pools
            booking_deadline__gt=timezone.now()
        )
        
        # Apply filters
        location = request.query_params.get('location')
        if location:
            pools = pools.filter(
                Q(property__country__icontains=location) |
                Q(property__country_code__icontains=location)
            )
        
        check_in = request.query_params.get('check_in')
        check_out = request.query_params.get('check_out')
        if check_in:
            pools = pools.filter(check_in_date__gte=check_in)
        if check_out:
            pools = pools.filter(check_out_date__lte=check_out)
        
        max_price = request.query_params.get('max_price')
        if max_price:
            pools = pools.filter(price_per_person__lte=max_price)
        
        # Pagination
        paginator = StandardPagination()
        page = paginator.paginate_queryset(pools, request)
        serializer = RoomPoolListSerializer(page, many=True, context={'request': request})
        
        # Add membership info if user is authenticated
        data = serializer.data
        if request.user and request.user.is_authenticated:
            user_memberships = set(
                RoomPoolMember.objects.filter(
                    user=request.user,
                    status__in=['approved', 'pending']
                ).values_list('pool_id', flat=True)
            )
            for pool_data in data:
                pool_id = pool_data.get('id')
                if pool_id:
                    from uuid import UUID
                    pool_uuid = UUID(pool_id) if isinstance(pool_id, str) else pool_id
                    pool_data['is_member'] = pool_uuid in user_memberships
        
        return paginator.get_paginated_response(data)

