from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Debt, Payment
from .serializers import DebtSerializer, PaymentSerializer


class DebtViewSet(viewsets.ModelViewSet):
    serializer_class = DebtSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['created_at', 'current_balance']

    def get_queryset(self):
        qs = Debt.objects.filter(user=self.request.user)
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        total = Debt.objects.filter(user=request.user, status='active').aggregate(total=Sum('current_balance'))['total'] or 0
        return Response({'total_debt': total})

    @action(detail=False, methods=['get'])
    def recent(self, request):
        from django.utils import timezone
        now = timezone.now()
        payments = Payment.objects.filter(user=request.user, date__year=now.year, date__month=now.month)[:10]
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)
