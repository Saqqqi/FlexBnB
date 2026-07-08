from rest_framework import serializers

from .models import User


class UserDetailSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'name',
            'email',
            'avatar_url',
        )

    def get_avatar_url(self, obj):
        return obj.avatar_url()
