#!/usr/bin/env python
"""
Script pour mettre à jour les relations de parrainage avec les générations.
Ce script configure les générations pour les parrainages existants.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'invest_backend.settings')
django.setup()

from api.models import Referral, ReferralCode
from django.db import transaction

def setup_referral_generations():
    """Configure les générations pour les parrainages existants."""
    
    print("Mise à jour des générations de parrainage...")
    
    # Tous les parrainages doivent avoir au minimum la génération 1
    # car c'est le parrain direct de l'utilisateur
    referrals = Referral.objects.all()
    
    updated = 0
    for referral in referrals:
        if referral.generation != 1:
            referral.generation = 1
            referral.save()
            updated += 1
    
    print(f"✓ {updated} parrainage(s) mis à jour avec la génération par défaut (1)")
    
    # Vérifier les relations parent-enfant
    # Si le parrain d'un utilisateur a lui-même un parrain, c'est une génération 2
    print("\nVérification des relations parent-enfant...")
    
    gen2_updated = 0
    for referral in Referral.objects.filter(status='used'):
        # Trouver si le parrain a un code de parrainage
        try:
            referrer_user = referral.code.referrer
            # Chercher si ce parrain a été référé par quelqu'un
            parent_ref = Referral.objects.filter(
                referred_user=referrer_user,
                status='used'
            ).first()
            
            if parent_ref:
                # C'est une génération 2 (enfant)
                referral.generation = 2
                referral.parent_referral = parent_ref
                referral.save()
                gen2_updated += 1
        except:
            pass
    
    print(f"✓ {gen2_updated} parrainage(s) mis à jour en génération 2")
    
    # Vérifier les générations 3 (petit-enfants)
    print("\nVérification des générations 3...")
    
    gen3_updated = 0
    for referral in Referral.objects.filter(generation=2, status='used'):
        # Pour chaque génération 2, chercher les générations 3
        generation2_user = referral.referred_user
        
        # Chercher les parrainages directs de cet utilisateur de génération 2
        gen3_referrals = Referral.objects.filter(
            code__referrer=generation2_user,
            status='used'
        )
        
        for gen3_ref in gen3_referrals:
            gen3_ref.generation = 3
            gen3_ref.parent_referral = referral
            gen3_ref.save()
            gen3_updated += 1
    
    print(f"✓ {gen3_updated} parrainage(s) mis à jour en génération 3")
    
    # Afficher un résumé
    print("\n=== RÉSUMÉ ===")
    gen1 = Referral.objects.filter(generation=1).count()
    gen2 = Referral.objects.filter(generation=2).count()
    gen3 = Referral.objects.filter(generation=3).count()
    
    print(f"Génération 1 (Parents): {gen1}")
    print(f"Génération 2 (Enfants): {gen2}")
    print(f"Génération 3 (Petits-enfants): {gen3}")
    print(f"Total: {gen1 + gen2 + gen3}")
    
    print("\n✅ Configuration des générations terminée !")

if __name__ == '__main__':
    setup_referral_generations()
