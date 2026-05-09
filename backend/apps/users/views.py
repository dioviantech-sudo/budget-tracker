from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserSerializer, RegisterSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User created successfully.'
        }, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data.get('email') or request.data.get('username'))
            response.data['user'] = UserSerializer(user).data
        return response


class ResetDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        password = request.data.get('password')
        if not password:
            return Response({'detail': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(password):
            return Response({'detail': 'Incorrect password.'}, status=status.HTTP_403_FORBIDDEN)

        from apps.transactions.models import Transaction
        from apps.debts.models import Debt, Payment
        from apps.savings.models import SavingsGoal
        from apps.recurring.models import RecurringBill
        from apps.accounts.models import Account
        from apps.categories.models import Category

        counts = {
            'transactions': Transaction.objects.filter(user=user).count(),
            'payments': Payment.objects.filter(user=user).count(),
            'debts': Debt.objects.filter(user=user).count(),
            'savings_goals': SavingsGoal.objects.filter(user=user).count(),
            'recurring_bills': RecurringBill.objects.filter(user=user).count(),
            'accounts': Account.objects.filter(user=user).count(),
            'categories': Category.objects.filter(user=user, is_default=False).count(),
        }

        Transaction.objects.filter(user=user).delete()
        Payment.objects.filter(user=user).delete()
        Debt.objects.filter(user=user).delete()
        SavingsGoal.objects.filter(user=user).delete()
        RecurringBill.objects.filter(user=user).delete()
        Account.objects.filter(user=user).delete()
        Category.objects.filter(user=user, is_default=False).delete()

        return Response({
            'message': 'All data cleared successfully.',
            'cleared': counts,
        }, status=status.HTTP_200_OK)
