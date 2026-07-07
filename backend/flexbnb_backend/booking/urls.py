from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/stats/', views.host_dashboard_stats, name='host_dashboard_stats'),
    path('reservations/', views.host_reservations, name='host_reservations'),
    path('reservations/<uuid:reservation_id>/status/', views.update_reservation_status, name='update_reservation_status'),
    path('reservations/create/', views.create_reservation, name='create_reservation'),
    path('earnings/', views.host_earnings, name='host_earnings'),
    path('messages/', views.host_messages, name='host_messages'),
    path('messages/send/', views.send_message, name='send_message'),
    path('analytics/', views.property_analytics, name='property_analytics'),
    path('reviews/', views.property_reviews, name='property_reviews'),
    path('reviews/submit/', views.submit_property_review, name='submit_property_review'),
    path('guest-reviews/', views.guest_reviews_for_host, name='guest_reviews_for_host'),
    path('guest-reviews/submit/', views.submit_guest_review, name='submit_guest_review'),
    path('guest-reservations/', views.guest_reservations, name='guest_reservations'),
    path('can-review/', views.can_review_property, name='can_review_property'),
    # Room Pool Reservations
    path('pool-member-reservations/', views.pool_member_reservations, name='pool_member_reservations'),
    path('host-pool-reservations/', views.host_pool_reservations, name='host_pool_reservations'),
]
