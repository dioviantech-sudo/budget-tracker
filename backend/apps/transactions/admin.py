from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['type', 'amount', 'date', 'account', 'category', 'user', 'created_at']
    list_filter = ['type', 'date', 'created_at']
    search_fields = ['description', 'notes', 'user__email']
    date_hierarchy = 'date'
