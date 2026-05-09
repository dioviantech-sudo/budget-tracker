from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.categories.models import Category
from apps.accounts.models import Account

User = get_user_model()

DEFAULT_CATEGORIES = [
    ('Salary', 'income', '#059669'),
    ('Freelance', 'income', '#10b981'),
    ('Food', 'expense', '#ef4444'),
    ('Rent', 'expense', '#f97316'),
    ('Utilities', 'expense', '#3b82f6'),
    ('Transport', 'expense', '#6366f1'),
    ('Entertainment', 'expense', '#8b5cf6'),
    ('Healthcare', 'expense', '#ec4899'),
    ('Shopping', 'expense', '#f59e0b'),
    ('Bills', 'expense', '#0d9488'),
    ('Miscellaneous', 'expense', '#6b7280'),
]

DEFAULT_ACCOUNTS = [
    ('BDO', 'bank'),
    ('GCash', 'digital'),
    ('Cash', 'cash'),
]


class Command(BaseCommand):
    help = 'Seed default categories and accounts for a user'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, required=True)

    def handle(self, *args, **options):
        email = options['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User with email {email} not found.'))
            return

        for name, ctype, color in DEFAULT_CATEGORIES:
            Category.objects.get_or_create(user=user, name=name, type=ctype, defaults={'color': color})

        for name, atype in DEFAULT_ACCOUNTS:
            Account.objects.get_or_create(user=user, name=name, type=atype, defaults={'balance': 0, 'initial_balance': 0})

        self.stdout.write(self.style.SUCCESS(f'Seeded defaults for {email}'))
