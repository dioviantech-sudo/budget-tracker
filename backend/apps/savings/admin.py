from django.contrib import admin
from .models import SavingsGoal, SavingsTransaction


@admin.register(SavingsGoal)
class SavingsGoalAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'target_amount', 'current_balance', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'user__email']


@admin.register(SavingsTransaction)
class SavingsTransactionAdmin(admin.ModelAdmin):
    list_display = ['goal', 'type', 'amount', 'date', 'user', 'created_at']
    list_filter = ['type', 'date', 'created_at']
    search_fields = ['goal__name', 'user__email']
    date_hierarchy = 'date'
