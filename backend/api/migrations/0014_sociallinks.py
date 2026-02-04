# Generated migration for SocialLinks model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_alter_marketoffer_status'),
    ]

    operations = [
        migrations.CreateModel(
            name='SocialLinks',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('whatsapp_channel', models.URLField(blank=True, max_length=500, null=True, verbose_name='Lien Canal WhatsApp')),
                ('whatsapp_group', models.URLField(blank=True, max_length=500, null=True, verbose_name='Lien Groupe WhatsApp')),
                ('telegram_channel', models.URLField(blank=True, max_length=500, null=True, verbose_name='Lien Canal Telegram')),
                ('telegram_group', models.URLField(blank=True, max_length=500, null=True, verbose_name='Lien Groupe Telegram')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Lien Réseau Social',
                'verbose_name_plural': 'Liens Réseaux Sociaux',
            },
        ),
    ]
