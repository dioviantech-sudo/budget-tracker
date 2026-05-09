from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from .models import RecurringBill
from .serializers import RecurringBillSerializer


class RecurringBillViewSet(viewsets.ModelViewSet):
    serializer_class = RecurringBillSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['due_day', 'amount']

    def get_queryset(self):
        return RecurringBill.objects.filter(user=self.request.user, is_active=True)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        total = RecurringBill.objects.filter(user=request.user, is_active=True).aggregate(total=Sum('amount'))['total'] or 0
        return Response({'total_recurring': total})

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        now = timezone.now()
        bills = RecurringBill.objects.filter(user=request.user, is_active=True)
        upcoming = []
        for bill in bills:
            days_until = bill.due_day - now.day
            if 0 <= days_until <= 7:
                upcoming.append({
                    'id': bill.id,
                    'name': bill.name,
                    'amount': bill.amount,
                    'due_day': bill.due_day,
                    'days_until': days_until,
                })
        return Response(upcoming)
