from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DebtViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r'', DebtViewSet, basename='debt')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]
