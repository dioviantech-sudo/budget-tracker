import json
import os
from decimal import Decimal
from datetime import datetime, date

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from apps.accounts.models import Account
from apps.categories.models import Category
from apps.transactions.models import Transaction
from apps.debts.models import Debt, Payment
from apps.savings.models import SavingsGoal
from apps.recurring.models import RecurringBill

User = get_user_model()


class Command(BaseCommand):
    help = 'Import old budget app data from exported JSON'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='old_data.json',
            help='Path to the exported JSON file (relative to BASE_DIR)'
        )
        parser.add_argument(
            '--email',
            type=str,
            required=True,
            help='Email of the user to import data for'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what would be imported without saving'
        )

    def handle(self, *args, **options):
        file_path = options['file']
        email = options['email']
        dry_run = options['dry_run']

        # Resolve file path
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        full_path = os.path.join(base_dir, file_path)

        if not os.path.exists(full_path):
            self.stdout.write(self.style.ERROR(f'File not found: {full_path}'))
            self.stdout.write(self.style.WARNING('Export your old data first:'))
            self.stdout.write(self.style.WARNING('  1. Open old-budget/BudgetProject/export_data.html in browser'))
            self.stdout.write(self.style.WARNING('  2. Click "Scan & Export Data"'))
            self.stdout.write(self.style.WARNING(f'  3. Move downloaded JSON to: {full_path}'))
            return

        # Load JSON
        with open(full_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Get user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User with email {email} not found.'))
            return

        self.stdout.write(self.style.SUCCESS(f'Importing data for {email}...'))

        # Detect format
        has_year_data = bool(data.get('year_data')) or any(
            isinstance(data.get(str(y)), dict) for y in range(2020, 2036)
        )
        has_tracker_data = bool(data.get('tracker_data')) or (
            isinstance(data, dict) and 'transactions' in data and isinstance(data.get('transactions'), list)
        )

        if has_year_data:
            self.import_year_format(data, user, dry_run)
        elif has_tracker_data:
            self.import_tracker_format(data, user, dry_run)
        else:
            self.stdout.write(self.style.ERROR('Unknown data format. Could not detect old app version.'))

    def import_year_format(self, data, user, dry_run):
        """Import from diom_budget_* year-based format"""
        year_data = data.get('year_data', {})
        if not year_data:
            # Try top-level year keys
            year_data = {k: v for k, v in data.items() if k.isdigit()}

        self.stdout.write(self.style.NOTICE(f'Found {len(year_data)} year(s) of data'))

        # Gather all data across years
        all_expenses = []
        all_shopee = []
        all_insurance = []
        all_debts = []
        all_savings = []
        accounts_data = {}
        semi_income = 62000

        for year, ydata in year_data.items():
            if not isinstance(ydata, dict):
                continue
            if 'expenses' in ydata:
                for e in ydata['expenses']:
                    e['_year'] = year
                all_expenses.extend(ydata['expenses'])
            if 'shopee' in ydata:
                for s in ydata['shopee']:
                    s['_year'] = year
                all_shopee.extend(ydata['shopee'])
            if 'insurance' in ydata:
                for i in ydata['insurance']:
                    i['_year'] = year
                all_insurance.extend(ydata['insurance'])
            if 'debts' in ydata:
                for d in ydata['debts']:
                    d['_year'] = year
                all_debts.extend(ydata['debts'])
            if 'savingsGoals' in ydata:
                for g in ydata['savingsGoals']:
                    g['_year'] = year
                all_savings.extend(ydata['savingsGoals'])
            if 'accounts' in ydata:
                accounts_data = ydata.get('accounts', {})
            if 'semiIncome' in ydata:
                semi_income = ydata.get('semiIncome', semi_income)

        # Deduplicate expenses by name+amount+due (these become recurring)
        seen_recurring = set()
        recurring_items = []
        for e in all_expenses:
            key = (e.get('name'), e.get('amount'), e.get('due'))
            if key not in seen_recurring:
                seen_recurring.add(key)
                recurring_items.append(e)

        # Deduplicate debts by bank+total
        seen_debts = set()
        debts_items = []
        for d in all_debts:
            key = (d.get('bank'), d.get('total'))
            if key not in seen_debts:
                seen_debts.add(key)
                debts_items.append(d)

        # Deduplicate savings by name
        seen_savings = set()
        savings_items = []
        for g in all_savings:
            key = g.get('name')
            if key not in seen_savings:
                seen_savings.add(key)
                savings_items.append(g)

        self.stdout.write(self.style.NOTICE(
            f'Found: {len(all_expenses)} expense entries, {len(all_shopee)} shopee, '
            f'{len(all_insurance)} insurance, {len(debts_items)} debts, '
            f'{len(savings_items)} savings goals'
        ))

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - nothing saved'))
            return

        # Step 1: Create Accounts
        account_map = self._create_accounts(user, accounts_data)

        # Step 2: Create Categories
        category_map = self._create_categories(user, all_expenses, all_shopee, all_insurance)

        # Step 3: Create Recurring Bills
        self._create_recurring(user, recurring_items, account_map)

        # Step 4: Create Transactions (expenses as monthly transactions, shopee, insurance, income)
        self._create_transactions_from_expenses(user, all_expenses, account_map, category_map)
        self._create_transactions_from_shopee(user, all_shopee, account_map, category_map)
        self._create_transactions_from_insurance(user, all_insurance, account_map, category_map)
        self._create_income_transactions(user, year_data, semi_income, account_map, category_map)

        # Step 5: Create Debts & Payments
        self._create_debts(user, debts_items)

        # Step 6: Create Savings Goals
        self._create_savings(user, savings_items)

        self.stdout.write(self.style.SUCCESS('Import complete!'))

    def import_tracker_format(self, data, user, dry_run):
        """Import from budget_tracker_data format"""
        tracker = data.get('tracker_data', data)
        if 'transactions' not in tracker and 'debts' not in tracker:
            self.stdout.write(self.style.ERROR('Could not find tracker data structure'))
            return

        self.stdout.write(self.style.NOTICE('Detected budget-tracker format'))

        tx_count = len(tracker.get('transactions', []))
        debt_count = len(tracker.get('debts', []))
        savings_count = len(tracker.get('savings', []))
        recurring_count = len(tracker.get('recurring', []))

        self.stdout.write(self.style.NOTICE(
            f'Found: {tx_count} transactions, {debt_count} debts, '
            f'{savings_count} savings, {recurring_count} recurring'
        ))

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - nothing saved'))
            return

        # Create accounts from transaction account names
        account_names = set()
        for t in tracker.get('transactions', []):
            if t.get('account'):
                account_names.add(t['account'])
        for r in tracker.get('recurring', []):
            if r.get('account'):
                account_names.add(r['account'])

        account_map = {}
        for name in account_names:
            acc, _ = Account.objects.get_or_create(
                user=user,
                name=name,
                defaults={'type': 'bank', 'balance': 0, 'initial_balance': 0}
            )
            account_map[name] = acc

        # Create categories
        cat_names = set()
        for t in tracker.get('transactions', []):
            if t.get('category'):
                cat_names.add((t['category'], t.get('type', 'expense')))
        for r in tracker.get('recurring', []):
            if r.get('category'):
                cat_names.add((r['category'], r.get('type', 'expense')))

        category_map = {}
        for name, ctype in cat_names:
            cat, _ = Category.objects.get_or_create(
                user=user,
                name=name,
                type=ctype,
                defaults={'color': '#0d9488'}
            )
            category_map[(name, ctype)] = cat

        # Import transactions
        for t in tracker.get('transactions', []):
            tx_type = t.get('type', 'expense')
            cat_name = t.get('category', 'General')
            cat_key = (cat_name, tx_type)
            category = category_map.get(cat_key)
            if not category:
                category, _ = Category.objects.get_or_create(
                    user=user, name=cat_name, type=tx_type,
                    defaults={'color': '#0d9488'}
                )
                category_map[cat_key] = category

            account = account_map.get(t.get('account'))

            Transaction.objects.create(
                user=user,
                account=account,
                category=category,
                type=tx_type,
                amount=Decimal(str(t.get('amount', 0))),
                date=t.get('date', date.today()),
                description=t.get('desc', ''),
                notes=t.get('notes', '')
            )

        # Import debts
        for d in tracker.get('debts', []):
            total = Decimal(str(d.get('original', d.get('balance', 0))))
            paid = Decimal(str(d.get('paid', 0)))
            debt = Debt.objects.create(
                user=user,
                name=d.get('name', 'Unknown Debt'),
                original_balance=total,
                current_balance=max(Decimal('0'), total - paid),
                interest_rate=Decimal(str(d.get('rate', 0))),
                monthly_payment=Decimal(str(d.get('minPayment', 0))),
                status='paid' if (total - paid) <= 0 else 'active'
            )
            # Create payment records
            for p in tracker.get('payments', []):
                if p.get('debtId') == d.get('id'):
                    Payment.objects.create(
                        user=user,
                        debt=debt,
                        amount=Decimal(str(p.get('amount', 0))),
                        date=p.get('date', date.today()),
                        notes='Imported from old app'
                    )

        # Import savings
        for s in tracker.get('savings', []):
            SavingsGoal.objects.create(
                user=user,
                name=s.get('name', 'Goal'),
                target_amount=Decimal(str(s.get('goal', s.get('target', 0)))),
                current_balance=Decimal(str(s.get('balance', s.get('saved', 0))))
            )

        # Import recurring
        for r in tracker.get('recurring', []):
            account = account_map.get(r.get('account'))
            RecurringBill.objects.create(
                user=user,
                name=r.get('desc', r.get('name', 'Bill')),
                amount=Decimal(str(r.get('amount', 0))),
                due_day=int(r.get('day', 1)),
                frequency='monthly',
                account=account,
                auto_pay=False,
                is_active=True
            )

        self.stdout.write(self.style.SUCCESS('Import complete!'))

    def _create_accounts(self, user, accounts_data):
        """Create accounts from old app account balances"""
        defaults = {
            'bdo': ('BDO', 'bank'),
            'gcash': ('GCash', 'digital'),
            'gotyme': ('Gotyme', 'digital'),
        }
        account_map = {}
        for key, (name, acc_type) in defaults.items():
            balance = Decimal(str(accounts_data.get(key, 0)))
            acc, _ = Account.objects.get_or_create(
                user=user,
                name=name,
                defaults={'type': acc_type, 'balance': balance, 'initial_balance': balance}
            )
            account_map[name] = acc
            account_map[key] = acc
        # Also map by lowercase name
        account_map['cash'] = account_map.get('GCash')  # fallback
        self.stdout.write(self.style.NOTICE(f'Created {len(defaults)} accounts'))
        return account_map

    def _create_categories(self, user, expenses, shopee, insurance):
        """Auto-create categories from expense names"""
        # Map expense names to categories
        category_names = set()
        for e in expenses:
            name = e.get('name', 'General')
            category_names.add((name, 'expense'))
        category_names.add(('Shopee', 'expense'))
        category_names.add(('Insurance', 'expense'))
        category_names.add(('Salary', 'income'))

        category_map = {}
        colors = ['#0d9488', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#6366f1', '#ec4899']
        for idx, (name, ctype) in enumerate(category_names):
            cat, _ = Category.objects.get_or_create(
                user=user,
                name=name,
                type=ctype,
                defaults={'color': colors[idx % len(colors)]}
            )
            category_map[(name, ctype)] = cat
        self.stdout.write(self.style.NOTICE(f'Created {len(category_names)} categories'))
        return category_map

    def _create_recurring(self, user, recurring_items, account_map):
        """Create RecurringBill records from unique expenses"""
        count = 0
        for e in recurring_items:
            name = e.get('name', 'Bill')
            acc_name = e.get('account', 'BDO')
            account = account_map.get(acc_name) or account_map.get(acc_name.lower())
            RecurringBill.objects.create(
                user=user,
                name=name,
                amount=Decimal(str(e.get('amount', 0))),
                due_day=int(e.get('due', 1)),
                frequency='monthly',
                account=account,
                auto_pay=False,
                is_active=True,
                notes=e.get('notes', '')
            )
            count += 1
        self.stdout.write(self.style.NOTICE(f'Created {count} recurring bills'))

    def _create_transactions_from_expenses(self, user, all_expenses, account_map, category_map):
        """Convert each expense into 12 monthly transactions for its year"""
        count = 0
        for e in all_expenses:
            year = int(e.get('_year', datetime.now().year))
            name = e.get('name', 'Expense')
            amount = Decimal(str(e.get('amount', 0)))
            due_day = int(e.get('due', 1))
            acc_name = e.get('account', 'BDO')
            account = account_map.get(acc_name) or account_map.get(acc_name.lower())
            category = category_map.get((name, 'expense'))
            notes = e.get('notes', '')

            # Create monthly transactions for the year
            for month in range(1, 13):
                days_in_month = [31, 29 if (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0) else 28,
                                 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
                day = min(due_day, days_in_month)
                tx_date = date(year, month, day)
                Transaction.objects.create(
                    user=user,
                    account=account,
                    category=category,
                    type='expense',
                    amount=amount,
                    date=tx_date,
                    description=name,
                    notes=notes
                )
                count += 1
        self.stdout.write(self.style.NOTICE(f'Created {count} expense transactions'))

    def _create_transactions_from_shopee(self, user, all_shopee, account_map, category_map):
        """Create transactions from shopee installments"""
        count = 0
        months = {'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
                  'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6,
                  'jul': 7, 'july': 7, 'aug': 8, 'august': 8,
                  'sep': 9, 'sept': 9, 'september': 9, 'oct': 10, 'october': 10,
                  'nov': 11, 'november': 11, 'dec': 12, 'december': 12}
        category = category_map.get(('Shopee', 'expense'))
        account = account_map.get('BDO')

        for s in all_shopee:
            year = int(s.get('_year', datetime.now().year))
            payday = s.get('payday', '')
            amount = Decimal(str(s.get('amount', 0)))

            # Parse "May 8" format
            parts = payday.lower().split()
            if len(parts) >= 2:
                month = months.get(parts[0], 1)
                day = int(''.join(filter(str.isdigit, parts[1])))
                try:
                    tx_date = date(year, month, day)
                    Transaction.objects.create(
                        user=user,
                        account=account,
                        category=category,
                        type='expense',
                        amount=amount,
                        date=tx_date,
                        description='Shopee Installment',
                        notes=f'Imported from old app: {payday}'
                    )
                    count += 1
                except ValueError:
                    pass
        self.stdout.write(self.style.NOTICE(f'Created {count} shopee transactions'))

    def _create_transactions_from_insurance(self, user, all_insurance, account_map, category_map):
        """Create transactions from insurance payments"""
        count = 0
        months = {'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
                  'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6,
                  'jul': 7, 'july': 7, 'aug': 8, 'august': 8,
                  'sep': 9, 'sept': 9, 'september': 9, 'oct': 10, 'october': 10,
                  'nov': 11, 'november': 11, 'dec': 12, 'december': 12}
        category = category_map.get(('Insurance', 'expense'))
        account = account_map.get('BDO')

        for ins in all_insurance:
            year = int(ins.get('_year', datetime.now().year))
            payday = ins.get('payday', '')
            amount = Decimal(str(ins.get('amount', 0)))
            name = ins.get('name', 'Insurance')

            parts = payday.lower().split()
            if len(parts) >= 2:
                month = months.get(parts[0], 1)
                day = int(''.join(filter(str.isdigit, parts[1])))
                try:
                    tx_date = date(year, month, day)
                    Transaction.objects.create(
                        user=user,
                        account=account,
                        category=category,
                        type='expense',
                        amount=amount,
                        date=tx_date,
                        description=name,
                        notes=f'Imported from old app: {payday}'
                    )
                    count += 1
                except ValueError:
                    pass
        self.stdout.write(self.style.NOTICE(f'Created {count} insurance transactions'))

    def _create_income_transactions(self, user, year_data, semi_income, account_map, category_map):
        """Create semi-monthly salary income transactions"""
        count = 0
        salary_cat = category_map.get(('Salary', 'income'))
        account = account_map.get('BDO')

        for year_str in year_data.keys():
            if not str(year_str).isdigit():
                continue
            year = int(year_str)
            for month in range(1, 13):
                for day in [8, 23]:
                    tx_date = date(year, month, day)
                    Transaction.objects.create(
                        user=user,
                        account=account,
                        category=salary_cat,
                        type='income',
                        amount=Decimal(str(semi_income)),
                        date=tx_date,
                        description=f'Salary ({day}th)',
                        notes='Imported from old app semi-monthly income'
                    )
                    count += 1
        self.stdout.write(self.style.NOTICE(f'Created {count} income transactions'))

    def _create_debts(self, user, debts_items):
        """Create Debt and Payment records"""
        count = 0
        for d in debts_items:
            total = Decimal(str(d.get('total', 0)))
            paid = Decimal(str(d.get('paid', 0)))
            remaining = max(Decimal('0'), total - paid)
            status = 'paid' if remaining <= 0 else 'active'

            Debt.objects.create(
                user=user,
                name=d.get('bank', 'Unknown Debt'),
                original_balance=total,
                current_balance=remaining,
                interest_rate=Decimal('0'),
                monthly_payment=Decimal('0'),
                status=status
            )
            count += 1
        self.stdout.write(self.style.NOTICE(f'Created {count} debts'))

    def _create_savings(self, user, savings_items):
        """Create SavingsGoal records"""
        count = 0
        for g in savings_items:
            SavingsGoal.objects.create(
                user=user,
                name=g.get('name', 'Goal'),
                target_amount=Decimal(str(g.get('target', 0))),
                current_balance=Decimal(str(g.get('saved', 0)))
            )
            count += 1
        self.stdout.write(self.style.NOTICE(f'Created {count} savings goals'))
