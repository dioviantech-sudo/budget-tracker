from rest_framework import serializers
from django.db.models import Sum
from .models import Debt, Payment
from apps.accounts.serializers import AccountSerializer


class PaymentSerializer(serializers.ModelSerializer):
    account_detail = AccountSerializer(source='account', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'debt', 'account', 'account_detail', 'amount', 'date', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class DebtSerializer(serializers.ModelSerializer):
    payments = PaymentSerializer(many=True, read_only=True)
    total_paid = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()

    class Meta:
        model = Debt
        fields = ['id', 'name', 'original_balance', 'current_balance', 'interest_rate', 'monthly_payment', 'status', 'due_date', 'total_paid', 'remaining', 'payments', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_total_paid(self, obj):
        return obj.payments.aggregate(total=Sum('amount'))['total'] or 0

    def get_remaining(self, obj):
        return obj.current_balance

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
