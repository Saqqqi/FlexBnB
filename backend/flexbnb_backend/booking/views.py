from rest_framework import status, permissions
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from useraccount.auth import ClerkAuthentication
from .models import (
    Reservation, 
    HostEarnings, 
    HostMessage, 
    PropertyAnalytics, 
    PropertyReview,
    GuestReview
)
from .serializers import (
    ReservationSerializer,
    HostEarningsSerializer,
    HostMessageSerializer,
    PropertyAnalyticsSerializer,
    PropertyReviewSerializer,
    GuestReviewSerializer,
    HostDashboardStatsSerializer
)
from property.models import Property
from django.core.exceptions import ValidationError


def _serialize_validation_error(e: ValidationError):
    try:
        if hasattr(e, 'message_dict') and e.message_dict:
            return e.message_dict
        if hasattr(e, 'messages') and e.messages:
            return e.messages
        return str(e)
    except Exception:
        return str(e)


@api_view(['GET'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def host_dashboard_stats(request):
    """Get comprehensive dashboard statistics for the host"""
    user = request.user
    
    # Get all properties for this host
    host_properties = Property.objects.filter(Host=user)
    
    # Calculate stats
    total_properties = host_properties.count()
    
    # Reservations stats
    all_reservations = Reservation.objects.filter(host=user)
    total_reservations = all_reservations.count()
    pending_requests = all_reservations.filter(status='pending').count()
    
    # Earnings stats
    earnings = HostEarnings.objects.filter(host=user)
    total_earnings = earnings.aggregate(total=Sum('net_earnings'))['total'] or 0
    
    # This month earnings
    this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_earnings = earnings.filter(
        created_at__gte=this_month_start
    ).aggregate(total=Sum('net_earnings'))['total'] or 0
    
    # Analytics aggregation
    analytics = PropertyAnalytics.objects.filter(property__in=host_properties)
    occupancy_rate = analytics.aggregate(avg_rate=Avg('occupancy_rate'))['avg_rate'] or 0
    average_rating = analytics.aggregate(avg_rating=Avg('average_rating'))['avg_rating'] or 0
    
    # Unread messages
    unread_messages = HostMessage.objects.filter(
        receiver=user, 
        is_read=False
    ).count()
    
    stats_data = {
        'total_properties': total_properties,
        'total_reservations': total_reservations,
        'pending_requests': pending_requests,
        'total_earnings': total_earnings,
        'this_month_earnings': this_month_earnings,
        'occupancy_rate': occupancy_rate,
        'average_rating': average_rating,
        'unread_messages': unread_messages
    }
    
    serializer = HostDashboardStatsSerializer(stats_data)
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def host_reservations(request):
    """Get all reservations for the host's properties"""
    user = request.user
    status_filter = request.query_params.get('status', None)
    
    reservations = Reservation.objects.filter(host=user)
    
    if status_filter:
        reservations = reservations.filter(status=status_filter)
    
    reservations = reservations.order_by('-created_at')[:50]  # Limit to latest 50
    
    serializer = ReservationSerializer(reservations, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def update_reservation_status(request, reservation_id):
    """Approve or decline a booking request"""
    try:
        reservation = Reservation.objects.get(id=reservation_id, host=request.user)
        new_status = request.data.get('status')
        
        if new_status not in ['approved', 'declined']:
            return Response(
                {'error': 'Invalid status. Must be approved or declined'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = new_status
        reservation.save()
        
        # If approved, create earnings record
        if new_status == 'approved' and not hasattr(reservation, 'earnings_record'):
            platform_fee = reservation.total_price * Decimal('0.1')  # 10% platform fee
            net_earnings = reservation.total_price - platform_fee
            
            HostEarnings.objects.create(
                host=request.user,
                reservation=reservation,
                gross_earnings=reservation.total_price,
                platform_fee=platform_fee,
                net_earnings=net_earnings
            )
            
            # If this is a room pool booking, update the pool status
            if reservation.is_room_pool and reservation.room_pool_id:
                try:
                    from roompooling.models import RoomPool, PoolChat
                    pool = RoomPool.objects.get(id=reservation.room_pool_id)
                    
                    # Send notification to pool chat
                    PoolChat.objects.create(
                        pool=pool,
                        message_type='system',
                        message=f'✅ Great news! The host has approved our booking!'
                    )
                except Exception:
                    pass  # Pool notification is optional
        
        # If declined and this is a room pool, notify members
        if new_status == 'declined' and reservation.is_room_pool and reservation.room_pool_id:
            try:
                from roompooling.models import RoomPool, PoolChat
                pool = RoomPool.objects.get(id=reservation.room_pool_id)
                pool.status = 'cancelled'
                pool.save()
                
                PoolChat.objects.create(
                    pool=pool,
                    message_type='system',
                    message=f'❌ Unfortunately, the host has declined our booking request.'
                )
            except Exception:
                pass
        
        serializer = ReservationSerializer(reservation)
        return Response(serializer.data)
        
    except Reservation.DoesNotExist:
        return Response(
            {'error': 'Reservation not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def host_earnings(request):
    """Get earnings and financial reports for the host"""
    user = request.user
    
    earnings = HostEarnings.objects.filter(host=user).order_by('-created_at')
    
    # Filter by date range if provided
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    if start_date:
        earnings = earnings.filter(created_at__date__gte=start_date)
    if end_date:
        earnings = earnings.filter(created_at__date__lte=end_date)
    
    serializer = HostEarningsSerializer(earnings, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def host_messages(request):
    """Get messages for the host"""
    user = request.user
    
    messages = HostMessage.objects.filter(
        Q(sender=user) | Q(receiver=user)
    ).order_by('-created_at')
    
    # Mark messages as read if they're received by current user
    unread_messages = messages.filter(receiver=user, is_read=False)
    unread_messages.update(is_read=True)
    
    serializer = HostMessageSerializer(messages, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def send_message(request):
    """Send a message to a guest"""
    reservation_id = request.data.get('reservation_id')
    message_text = request.data.get('message')
    
    try:
        reservation = Reservation.objects.get(id=reservation_id, host=request.user)
        
        message = HostMessage.objects.create(
            reservation=reservation,
            sender=request.user,
            receiver=reservation.guest,
            message=message_text
        )
        
        serializer = HostMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Reservation.DoesNotExist:
        return Response(
            {'error': 'Reservation not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def property_analytics(request):
    """Get analytics for all host properties"""
    user = request.user
    
    host_properties = Property.objects.filter(Host=user)
    analytics = PropertyAnalytics.objects.filter(property__in=host_properties)
    
    serializer = PropertyAnalyticsSerializer(analytics, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def property_reviews(request):
    """Public endpoint: Get reviews for a property (or for host properties when authenticated). Supports filters and simple pagination."""
    property_id = request.query_params.get('property_id')
    status_filter = request.query_params.get('status')  # e.g., 'approved' (kept for future moderation compatibility)
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 10))

    qs = PropertyReview.objects.all().order_by('-created_at')

    # If property_id provided, filter to that property
    if property_id:
        try:
            prop = Property.objects.get(id=property_id)
            qs = qs.filter(property=prop)
        except Property.DoesNotExist:
            return Response({'count': 0, 'results': []})

    # If authenticated and no property_id, allow hosts to fetch all their property reviews
    if not property_id and request.user and request.user.is_authenticated:
        host_properties = Property.objects.filter(Host=request.user)
        qs = qs.filter(property__in=host_properties)

    # Placeholder: status filter for future moderation
    if status_filter:
        # No moderation status stored yet; keep for forward compatibility
        pass

    total = qs.count()
    start = (page - 1) * page_size
    end = start + page_size
    items = qs[start:end]

    serializer = PropertyReviewSerializer(items, many=True)

    # Adapt shape expected by frontend: include overall_rating alias
    results = []
    for item in serializer.data:
        item_copy = dict(item)
        item_copy['overall_rating'] = item_copy.get('rating')
        results.append(item_copy)

    return Response({
        'count': total,
        'page': page,
        'page_size': page_size,
        'results': results,
    })


@api_view(['POST'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def submit_property_review(request):
    """Guest submits a review for a property after a completed stay via reservation id."""
    try:
        reservation_id = request.data.get('reservation_id')
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')
        cleanliness_rating = request.data.get('cleanliness_rating')
        communication_rating = request.data.get('communication_rating')
        location_rating = request.data.get('location_rating')
        value_rating = request.data.get('value_rating')

        # Basic validation
        missing = [k for k in ['reservation_id', 'rating', 'cleanliness_rating', 'communication_rating', 'location_rating', 'value_rating'] if not request.data.get(k)]
        if missing:
            return Response({'error': f"Missing fields: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reservation = Reservation.objects.get(id=reservation_id)
        except Reservation.DoesNotExist:
            return Response({'error': 'Reservation not found'}, status=status.HTTP_404_NOT_FOUND)

        # Eligibility: requester must be the guest; reservation must be completed or approved past check-out; one review per reservation
        if reservation.guest != request.user:
            return Response({'error': 'Not authorized to review this reservation'}, status=status.HTTP_403_FORBIDDEN)

        # Allow reviews for completed reservations OR approved reservations on or past check-out date
        today = timezone.now().date()
        is_eligible = (
            reservation.status == 'completed' or 
            (reservation.status == 'approved' and reservation.check_out_date <= today)
        )
        
        if not is_eligible:
            return Response({'error': 'You can only review after the stay is completed or on/past the check-out date'}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(reservation, 'review'):
            return Response({'error': 'You have already submitted a review for this stay'}, status=status.HTTP_400_BAD_REQUEST)

        # Simple moderation heuristics (fake/spam detection)
        text = (comment or '').strip()
        banned_fragments = ['http://', 'https://', 'www.', 'contact me', 'whatsapp', 'telegram']
        if any(frag in text.lower() for frag in banned_fragments):
            return Response({'error': 'Review appears to contain promotional or external contact content'}, status=status.HTTP_400_BAD_REQUEST)

        if len(text) > 0 and len(text) < 10:
            return Response({'error': 'Please provide a bit more detail in your feedback'}, status=status.HTTP_400_BAD_REQUEST)

        # Create review
        review = PropertyReview.objects.create(
            property=reservation.property,
            reservation=reservation,
            guest=request.user,
            rating=int(rating),
            comment=text,
            cleanliness_rating=int(cleanliness_rating),
            communication_rating=int(communication_rating),
            location_rating=int(location_rating),
            value_rating=int(value_rating),
        )

        serializer = PropertyReviewSerializer(review)
        data = dict(serializer.data)
        data['overall_rating'] = data.get('rating')

        return Response(data, status=status.HTTP_201_CREATED)
    except ValidationError as e:
        return Response({'error': 'ValidationError', 'detail': _serialize_validation_error(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': 'Unexpected server error', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def submit_guest_review(request):
    """Host submits a review for a guest after a completed stay via reservation id."""
    try:
        reservation_id = request.data.get('reservation_id')
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')
        cleanliness_rating = request.data.get('cleanliness_rating')
        communication_rating = request.data.get('communication_rating')
        rule_compliance_rating = request.data.get('rule_compliance_rating')

        missing = [k for k in ['reservation_id', 'rating', 'cleanliness_rating', 'communication_rating', 'rule_compliance_rating'] if not request.data.get(k)]
        if missing:
            return Response({'error': f"Missing fields: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reservation = Reservation.objects.get(id=reservation_id)
        except Reservation.DoesNotExist:
            return Response({'error': 'Reservation not found'}, status=status.HTTP_404_NOT_FOUND)

        # Eligibility: requester must be the host; reservation must be completed or approved past check-out; one guest review per reservation
        if reservation.host != request.user:
            return Response({'error': 'Not authorized to review this guest'}, status=status.HTTP_403_FORBIDDEN)

        # Allow reviews for completed reservations OR approved reservations on or past check-out date
        today = timezone.now().date()
        is_eligible = (
            reservation.status == 'completed' or 
            (reservation.status == 'approved' and reservation.check_out_date <= today)
        )
        
        if not is_eligible:
            return Response({'error': 'You can only review after the stay is completed or on/past the check-out date'}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(reservation, 'guest_review'):
            return Response({'error': 'You have already submitted a guest review for this stay'}, status=status.HTTP_400_BAD_REQUEST)

        # Simple moderation
        text = (comment or '').strip()
        banned_fragments = ['http://', 'https://', 'www.', 'contact me', 'whatsapp', 'telegram']
        if any(frag in text.lower() for frag in banned_fragments):
            return Response({'error': 'Review appears to contain promotional or external contact content'}, status=status.HTTP_400_BAD_REQUEST)

        review = GuestReview.objects.create(
            reservation=reservation,
            host=request.user,
            guest=reservation.guest,
            rating=int(rating),
            comment=text,
            cleanliness_rating=int(cleanliness_rating),
            communication_rating=int(communication_rating),
            rule_compliance_rating=int(rule_compliance_rating),
        )

        serializer = GuestReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except ValidationError as e:
        return Response({'error': 'ValidationError', 'detail': _serialize_validation_error(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': 'Unexpected server error', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def guest_reviews_for_host(request):
    """Host can view guest reviews they've given; guests can view reviews received about them."""
    me = request.user
    mode = request.query_params.get('mode', 'given')  # 'given' or 'received'

    if mode == 'received':
        qs = GuestReview.objects.filter(guest=me).order_by('-created_at')
    else:
        qs = GuestReview.objects.filter(host=me).order_by('-created_at')

    serializer = GuestReviewSerializer(qs, many=True)
    return Response(serializer.data) 


@api_view(['GET'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def guest_reservations(request):
    """Get all reservations for the authenticated guest with a hasReview flag."""
    user = request.user
    status_filter = request.query_params.get('status', None)

    reservations = Reservation.objects.filter(guest=user)

    if status_filter:
        reservations = reservations.filter(status=status_filter)

    reservations = reservations.order_by('-created_at')[:50]

    serializer = ReservationSerializer(reservations, many=True)
    data = serializer.data

    # Inject hasReview flag based on presence of related review
    # Note: serializer.data is a list of dicts detached from model instances; we need a lookup.
    id_to_has_review = {str(r.id): hasattr(r, 'review') for r in reservations}
    for item in data:
        reservation_id = str(item.get('id'))
        item['hasReview'] = bool(id_to_has_review.get(reservation_id, False))

    return Response(data)


@api_view(['GET'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def can_review_property(request):
    """Return whether the user can review the given property, and the reservation_id to use."""
    user = request.user
    property_id = request.query_params.get('property_id')
    if not property_id:
        return Response({'canReview': False, 'reason': 'Missing property_id'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        prop = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({'canReview': False, 'reason': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)

    # Find a reservation for this user and property without an existing review
    # Allow reviews for completed reservations OR approved reservations on or past check-out date
    today = timezone.now().date()
    reservation = Reservation.objects.filter(
        guest=user,
        property=prop
    ).filter(
        Q(status='completed') | Q(status='approved', check_out_date__lte=today)
    ).exclude(
        review__isnull=False  # Exclude if review already exists
    ).order_by('-created_at').first()

    if not reservation:
        return Response({'canReview': False, 'reason': 'No eligible stay found'})

    if hasattr(reservation, 'review'):
        return Response({'canReview': False, 'reason': 'Already reviewed'})

    return Response({'canReview': True, 'reservation_id': str(reservation.id)})


@api_view(['POST'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def create_reservation(request):
    """Create a reservation for a property by the authenticated guest."""
    try:
        property_id = request.data.get('propertyId') or request.data.get('property_id')
        start_date = request.data.get('startDate') or request.data.get('check_in_date')
        end_date = request.data.get('endDate') or request.data.get('check_out_date')
        guests_count = int(request.data.get('guests_count') or 1)
        total_price = request.data.get('totalPrice')
        special_requests = request.data.get('special_requests') or ''

        if not property_id or not start_date or not end_date:
            return Response({'error': 'propertyId, startDate and endDate are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({'error': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)

        # Parse dates (accept ISO strings)
        try:
            check_in = datetime.fromisoformat(str(start_date).replace('Z','')).date()
            check_out = datetime.fromisoformat(str(end_date).replace('Z','')).date()
        except Exception:
            return Response({'error': 'Invalid date format'}, status=status.HTTP_400_BAD_REQUEST)

        # Compute price if not provided
        if total_price is None:
            nights = (check_out - check_in).days
            if nights <= 0:
                return Response({'error': 'End date must be after start date'}, status=status.HTTP_400_BAD_REQUEST)
            total_price = prop.price_per_night * nights
        total_price = float(total_price)

        booking_fee = round(total_price * 0.1, 2)
        host_earnings = round(total_price - booking_fee, 2)

        reservation = Reservation.objects.create(
            property=prop,
            guest=request.user,
            host=prop.Host,
            check_in_date=check_in,
            check_out_date=check_out,
            guests_count=guests_count,
            total_price=total_price,
            booking_fee=booking_fee,
            host_earnings=host_earnings,
            status='pending',
            special_requests=special_requests,
        )

        serializer = ReservationSerializer(reservation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except ValidationError as e:
        return Response({'error': 'ValidationError', 'detail': _serialize_validation_error(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': 'Unexpected server error', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def pool_member_reservations(request):
    """
    Get reservations where the user is a pool member (not just the primary guest).
    This allows pool members to see their shared bookings.
    """
    user = request.user
    
    try:
        from roompooling.models import RoomPoolMember, RoomPool
        
        # Find pools where user is an approved member
        member_pools = RoomPoolMember.objects.filter(
            user=user,
            status='approved'
        ).values_list('pool_id', flat=True)
        
        # Get reservations linked to those pools
        pool_reservations = Reservation.objects.filter(
            is_room_pool=True,
            room_pool_id__in=member_pools
        ).order_by('-created_at')
        
        # Enrich with pool membership info
        results = []
        for res in pool_reservations:
            res_data = ReservationSerializer(res).data
            
            # Get member's specific payment info
            try:
                pool = RoomPool.objects.get(id=res.room_pool_id)
                membership = RoomPoolMember.objects.get(pool=pool, user=user)
                res_data['pool_info'] = {
                    'pool_id': str(pool.id),
                    'pool_title': pool.title,
                    'my_share': float(membership.share_amount),
                    'amount_paid': float(membership.amount_paid),
                    'payment_status': membership.payment_status,
                    'is_creator': membership.is_creator,
                    'total_members': pool.current_members
                }
            except Exception:
                res_data['pool_info'] = None
            
            results.append(res_data)
        
        return Response(results)
        
    except ImportError:
        return Response({'error': 'Room pooling module not available'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([ClerkAuthentication])
@permission_classes([permissions.IsAuthenticated])
def host_pool_reservations(request):
    """
    Get room pool reservations for the host's properties.
    Shows additional pool information for the host.
    """
    user = request.user
    
    pool_reservations = Reservation.objects.filter(
        host=user,
        is_room_pool=True
    ).order_by('-created_at')
    
    results = []
    for res in pool_reservations:
        res_data = ReservationSerializer(res).data
        
        # Add pool details if available
        if res.room_pool_id:
            try:
                from roompooling.models import RoomPool, RoomPoolMember
                pool = RoomPool.objects.get(id=res.room_pool_id)
                members = RoomPoolMember.objects.filter(pool=pool, status='approved')
                
                res_data['pool_details'] = {
                    'pool_id': str(pool.id),
                    'pool_title': pool.title,
                    'creator_name': pool.creator.name,
                    'members': [
                        {
                            'name': m.user.name,
                            'email': m.user.email,
                            'share_amount': float(m.share_amount),
                            'payment_status': m.payment_status,
                            'is_creator': m.is_creator
                        }
                        for m in members
                    ],
                    'total_collected': float(sum(m.amount_paid for m in members)),
                    'visibility': pool.visibility
                }
            except Exception:
                res_data['pool_details'] = None
        
        results.append(res_data)
    
    return Response(results)