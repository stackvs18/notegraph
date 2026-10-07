from django.urls import path
from .views import HealthCheckView, GraphDataView, GraphStatsView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health_check'),
    path('', GraphDataView.as_view(), name='graph_data'),
    path('stats/', GraphStatsView.as_view(), name='graph_stats'),
]
