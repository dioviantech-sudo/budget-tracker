from django.contrib import admin
from .models import Debt, Payment


@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'original_balance', 'current_balance', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'user__email']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['debt', 'amount', 'date', 'account', 'user', 'created_at']
    list_filter = ['date', 'created_at']
    search_fields = ['debt__name', 'user__email']
    date_hierarchy = 'date'
