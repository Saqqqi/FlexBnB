from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profiles', views.RoommateProfileViewSet, basename='roommate-profile')
router.register(r'pools', views.RoomPoolViewSet, basename='room-pool')
router.register(r'invitations', views.PoolInvitationViewSet, basename='pool-invitation')

urlpatterns = [
    path('', include(router.urls)),
    
    # Roommate Matching
    path('matching/', views.RoommateMatchingView.as_view(), name='roommate-matching'),
    
    # Cost Split
    path('pools/<uuid:pool_id>/cost-split/', views.CostSplitView.as_view(), name='pool-cost-split'),
    path('cost-calculator/', views.CostCalculatorView.as_view(), name='cost-calculator'),
    
    # Pool Chat
    path('pools/<uuid:pool_id>/chat/', views.PoolChatViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='pool-chat'),
    path('pools/<uuid:pool_id>/chat/mark-read/', views.PoolChatViewSet.as_view({
        'post': 'mark_read'
    }), name='pool-chat-mark-read'),
    
    # Payment Tracking
    path('pools/<uuid:pool_id>/payments/', views.PaymentTrackingView.as_view(), name='pool-payments'),
    
    # Public Discovery
    path('discover/', views.PublicPoolsView.as_view(), name='discover-pools'),
]

