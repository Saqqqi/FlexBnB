from django.urls import path

from . import api


urlpatterns = [
    path('', api.properties_list, name='api_properties_list'),
    path('create/', api.create_property, name='api_create_property'),
    path('<uuid:pk>/', api.properties_detail, name='api_properties_detail'),
    # Property Images endpoints
    path('<uuid:pk>/images/', api.property_images, name='api_property_images'),
    path('<uuid:pk>/images/add/', api.add_property_images, name='api_add_property_images'),
    path('<uuid:pk>/images/<uuid:image_id>/delete/', api.delete_property_image, name='api_delete_property_image'),
    path('<uuid:pk>/images/<uuid:image_id>/set-primary/', api.set_primary_image, name='api_set_primary_image'),
]