from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UsuarioPerfil


class RegistroSerializer(serializers.Serializer):
    nombre           = serializers.CharField(max_length=150)
    apellido         = serializers.CharField(max_length=150)
    email            = serializers.EmailField()
    password         = serializers.CharField(min_length=8, write_only=True)
    password_confirmar = serializers.CharField(write_only=True)

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Ya existe una cuenta con este email.')
        return value

    def validate(self, data):
        if data['password'] != data['password_confirmar']:
            raise serializers.ValidationError({'password_confirmar': 'Las contraseñas no coinciden.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirmar')
        email = validated_data['email']
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=validated_data['nombre'],
            last_name=validated_data['apellido'],
            password=validated_data['password'],
        )
        UsuarioPerfil.objects.create(usuario=user, proveedor='local')
        return user


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UsuarioSerializer(serializers.ModelSerializer):
    nombre   = serializers.CharField(source='first_name')
    apellido = serializers.CharField(source='last_name')
    proveedor = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ('id', 'nombre', 'apellido', 'email', 'proveedor', 'date_joined')

    def get_proveedor(self, obj):
        try:
            return obj.perfil.proveedor
        except UsuarioPerfil.DoesNotExist:
            return 'local'
