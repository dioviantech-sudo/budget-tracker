from django.db import models
from django.conf import settings


class RecurringBill(models.Model):
    FREQUENCY_CHOICES = [
        ('monthly', 'Monthly'),
        ('weekly', 'Weekly'),
        ('yearly', 'Yearly'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recurring_bills')
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    due_day = models.PositiveSmallIntegerField(default=1, help_text="Day of month the bill is due")
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')
    account = models.ForeignKey('accounts.Account', on_delete=models.SET_NULL, null=True, blank=True, related_name='recurring_bills')
    auto_pay = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_day', '-created_at']

    def __str__(self):
        return f"{self.name} - {self.amount} (day {self.due_day})"
