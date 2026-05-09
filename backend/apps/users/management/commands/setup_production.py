import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Run migrations, create superuser from env vars, and seed defaults'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Running production setup...'))

        # 1. Run migrations
        from django.core.management import call_command
        call_command('migrate', '--noinput')
        self.stdout.write(self.style.SUCCESS('Migrations complete.'))

        # 2. Create superuser from env vars if not exists
        email = os.getenv('ADMIN_EMAIL')
        password = os.getenv('ADMIN_PASSWORD')
        username = os.getenv('ADMIN_USERNAME', 'admin')

        if email and password:
            if not User.objects.filter(email=email).exists():
                User.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password,
                    first_name='',
                    last_name=''
                )
                self.stdout.write(self.style.SUCCESS(f'Superuser {email} created.'))
            else:
                self.stdout.write(self.style.NOTICE(f'Superuser {email} already exists.'))
        else:
            self.stdout.write(self.style.WARNING('ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping superuser creation.'))

        # 3. Seed defaults
        if email:
            try:
                call_command('seed_defaults', '--email', email)
                self.stdout.write(self.style.SUCCESS('Default categories and accounts seeded.'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Seed defaults skipped: {e}'))

        self.stdout.write(self.style.SUCCESS('Production setup complete!'))
