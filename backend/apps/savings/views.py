from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import SavingsGoal, SavingsTransaction
from .serializers import SavingsGoalSerializer, SavingsTransactionSerializer


class SavingsGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SavingsGoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['created_at', 'target_amount']

    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        total = SavingsGoal.objects.filter(user=request.user).aggregate(total=Sum('current_balance'))['total'] or 0
        return Response({'total_savings': total})

    @action(detail=False, methods=['get'])
    def recent(self, request):
        from django.utils import timezone
        now = timezone.now()
        txs = SavingsTransaction.objects.filter(user=request.user, date__year=now.year, date__month=now.month)[:10]
        serializer = SavingsTransactionSerializer(txs, many=True)
        return Response(serializer.data)


class SavingsTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = SavingsTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavingsTransaction.objects.filter(user=self.request.user)
