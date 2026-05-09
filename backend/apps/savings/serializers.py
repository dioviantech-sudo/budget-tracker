from rest_framework import serializers
from .models import SavingsGoal, SavingsTransaction


class SavingsTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavingsTransaction
        fields = ['id', 'goal', 'type', 'amount', 'date', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SavingsGoalSerializer(serializers.ModelSerializer):
    transactions = SavingsTransactionSerializer(many=True, read_only=True)
    progress_pct = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()

    class Meta:
        model = SavingsGoal
        fields = ['id', 'name', 'target_amount', 'current_balance', 'target_date', 'is_active', 'progress_pct', 'remaining', 'transactions', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_progress_pct(self, obj):
        if obj.target_amount > 0:
            return min(100, round((obj.current_balance / obj.target_amount) * 100, 1))
        return 0

    def get_remaining(self, obj):
        return max(0, obj.target_amount - obj.current_balance)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
