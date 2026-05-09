from rest_framework import serializers
from .models import Transaction
from apps.accounts.serializers import AccountSerializer
from apps.categories.serializers import CategorySerializer


class TransactionSerializer(serializers.ModelSerializer):
    account_detail = AccountSerializer(source='account', read_only=True)
    category_detail = CategorySerializer(source='category', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'account', 'account_detail', 'category', 'category_detail', 'type', 'amount', 'date', 'description', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        tx = super().create(validated_data)
        self._update_account_balance(tx)
        return tx

    def update(self, instance, validated_data):
        old_amount = instance.amount
        old_type = instance.type
        old_account = instance.account
        tx = super().update(instance, validated_data)
        self._reconcile_account(old_account, old_amount, old_type, tx)
        return tx

    def _update_account_balance(self, tx):
        if tx.account:
            if tx.type == 'income':
                tx.account.balance += tx.amount
            else:
                tx.account.balance -= tx.amount
            tx.account.save()

    def _reconcile_account(self, old_account, old_amount, old_type, tx):
        if old_account == tx.account and old_amount == tx.amount and old_type == tx.type:
            return
        if old_account:
            if old_type == 'income':
                old_account.balance -= old_amount
            else:
                old_account.balance += old_amount
            old_account.save()
        self._update_account_balance(tx)
