from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SavingsGoalViewSet, SavingsTransactionViewSet

router = DefaultRouter()
router.register(r'', SavingsGoalViewSet, basename='savingsgoal')
router.register(r'transactions', SavingsTransactionViewSet, basename='savingstransaction')

urlpatterns = [
    path('', include(router.urls)),
]
