from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Account
from .serializers import AccountSerializer


class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        total = Account.objects.filter(user=request.user).aggregate(total=Sum('balance'))['total'] or 0
        return Response({'total_balance': total})
