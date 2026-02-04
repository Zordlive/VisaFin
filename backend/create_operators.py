#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'invest_backend.settings')
django.setup()

from api.models import Operateur

operators = [
    {'numero_agent': '+223 98765432', 'nom_agent': 'Agent Orange Mali', 'operateur': 'orange'},
    {'numero_agent': '+223 87654321', 'nom_agent': 'Agent Airtel Mali', 'operateur': 'airtel'},
    {'numero_agent': '+254 722123456', 'nom_agent': 'Agent M-Pesa Kenya', 'operateur': 'mpesa'},
]

for op in operators:
    obj, created = Operateur.objects.get_or_create(
        numero_agent=op['numero_agent'],
        operateur=op['operateur'],
        defaults={'nom_agent': op['nom_agent']}
    )
    status = 'Created' if created else 'Already exists'
    print(f'{status}: {op["operateur"]} - {op["numero_agent"]}')
