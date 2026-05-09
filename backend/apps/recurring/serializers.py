from rest_framework import serializers
from .models import RecurringBill
from apps.accounts.serializers import AccountSerializer


class RecurringBillSerializer(serializers.ModelSerializer):
    account_detail = AccountSerializer(source='account', read_only=True)

    class Meta:
        model = RecurringBill
        fields = ['id', 'name', 'amount', 'due_day', 'frequency', 'account', 'account_detail', 'auto_pay', 'notes', 'is_active', 'start_date', 'end_date', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
