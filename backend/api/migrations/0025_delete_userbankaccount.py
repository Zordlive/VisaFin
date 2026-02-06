from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0024_support_ticket_message'),
    ]

    operations = [
        migrations.DeleteModel(
            name='UserBankAccount',
        ),
    ]
