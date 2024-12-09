# maintenance/urls.py
from django.urls import path
from . import views

app_name = 'maintenance'    # URL 네임스페이스 설정

urlpatterns = [
    path('', views.main_page, name='main'),                        # 메인 페이지
    path('comparison/', views.model_comparison, name='comparison'), # 모델 비교 페이지
    path('analysis/', views.failure_analysis, name='analysis'),     # 고장 분석 페이지
    path('predict/', views.predict, name='predict'),               # 예측 페이지
]