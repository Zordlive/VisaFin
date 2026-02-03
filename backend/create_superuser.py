#!/usr/bin/env python
"""
Script pour créer un superuser Django automatiquement.
Usage: python create_superuser.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'invest_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@visafin-gest.org')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'AdminPass123!')

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f'✅ Superuser "{username}" créé avec succès')
else:
    print(f'⚠️ Superuser "{username}" existe déjà')
