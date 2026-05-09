from django.db import models
from django.conf import settings


class Debt(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paid', 'Paid'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='debts')
    name = models.CharField(max_length=255)
    original_balance = models.DecimalField(max_digits=15, decimal_places=2)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=6, decimal_places=2, default=0, blank=True)
    monthly_payment = models.DecimalField(max_digits=15, decimal_places=2, default=0, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.current_balance}"


class Payment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='debt_payments')
    debt = models.ForeignKey(Debt, on_delete=models.CASCADE, related_name='payments')
    account = models.ForeignKey('accounts.Account', on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"Payment {self.amount} on {self.date}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        debt = self.debt
        debt.current_balance = max(0, debt.current_balance - self.amount)
        if debt.current_balance <= 0:
            debt.status = 'paid'
        debt.save()
        if self.account:
            self.account.balance -= self.amount
            self.account.save()
