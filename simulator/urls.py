from django.urls import path
from . import views

app_name = 'simulator'

urlpatterns = [
    path('', views.simulator_main, name='main'),
    path('predict/', views.predict_failure, name='predict'),
    path('metrics/', views.get_model_metrics, name='metrics'),
]