from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecurringBillViewSet

router = DefaultRouter()
router.register(r'', RecurringBillViewSet, basename='recurringbill')

urlpatterns = [
    path('', include(router.urls)),
]
