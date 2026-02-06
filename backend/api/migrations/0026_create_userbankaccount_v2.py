from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0025_delete_userbankaccount'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserBankAccount',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('account_type', models.CharField(choices=[('crypto', 'Crypto'), ('mobile', 'Mobile money')], max_length=20, verbose_name='type de compte')),
                ('operator_name', models.CharField(blank=True, max_length=50, null=True, verbose_name='opérateur')),
                ('account_number', models.CharField(blank=True, max_length=100, null=True, verbose_name='numéro de compte')),
                ('account_holder_name', models.CharField(blank=True, max_length=200, null=True, verbose_name='nom du titulaire')),
                ('crypto_account', models.CharField(blank=True, max_length=100, null=True, verbose_name='compte crypto')),
                ('crypto_account_id', models.CharField(blank=True, max_length=150, null=True, verbose_name='id compte')),
                ('is_active', models.BooleanField(default=True, verbose_name='actif')),
                ('is_default', models.BooleanField(default=False, verbose_name='compte par défaut')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='date de création')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='date de mise à jour')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bank_accounts', to=settings.AUTH_USER_MODEL, verbose_name='utilisateur')),
            ],
            options={
                'verbose_name': 'compte bancaire utilisateur',
                'verbose_name_plural': 'comptes bancaires utilisateurs',
                'ordering': ['-is_default', '-created_at'],
            },
        ),
    ]
