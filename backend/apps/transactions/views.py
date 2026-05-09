from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from .models import Transaction
from .serializers import TransactionSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'notes', 'category__name']
    ordering_fields = ['date', 'amount', 'created_at']

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user)
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        category = self.request.query_params.get('category')
        tx_type = self.request.query_params.get('type')
        account = self.request.query_params.get('account')

        if year and year != 'all':
            qs = qs.filter(date__year=year)
        if month and month != 'all':
            qs = qs.filter(date__month=month)
        if category:
            qs = qs.filter(category_id=category)
        if tx_type:
            qs = qs.filter(type=tx_type)
        if account:
            qs = qs.filter(account_id=account)
        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        qs = Transaction.objects.filter(user=request.user)
        if year and year != 'all':
            qs = qs.filter(date__year=year)
        if month and month != 'all':
            qs = qs.filter(date__month=month)

        income = qs.filter(type='income').aggregate(total=Sum('amount'))['total'] or 0
        expense = qs.filter(type='expense').aggregate(total=Sum('amount'))['total'] or 0
        return Response({
            'income': income,
            'expenses': expense,
            'net': income - expense,
        })

    @action(detail=False, methods=['get'])
    def recent(self, request):
        now = timezone.now()
        qs = Transaction.objects.filter(user=request.user, date__year=now.year, date__month=now.month)
        serializer = self.get_serializer(qs[:10], many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        qs = Transaction.objects.filter(user=request.user, type='expense')
        if year and year != 'all':
            qs = qs.filter(date__year=year)
        if month and month != 'all':
            qs = qs.filter(date__month=month)
        data = qs.values('category__name', 'category__color').annotate(total=Sum('amount')).order_by('-total')
        return Response(data)
