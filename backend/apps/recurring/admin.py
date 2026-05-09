from django.contrib import admin
from .models import RecurringBill


@admin.register(RecurringBill)
class RecurringBillAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'amount', 'due_day', 'frequency', 'auto_pay', 'is_active', 'created_at']
    list_filter = ['frequency', 'auto_pay', 'is_active', 'created_at']
    search_fields = ['name', 'user__email']
