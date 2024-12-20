# maintenance/urls.py
from django.urls import path
from . import views

app_name = 'maintenance'

urlpatterns = [
    path('', views.main_page, name='main'),
    path('logistic/', views.logistic_regression, name='logistic'),
    path('knn/', views.knn_model, name='knn'),
    path('svm/', views.svm_model, name='svm'),
    path('decision-tree/', views.decision_tree, name='decision_tree'),
    path('random-forest/', views.random_forest, name='random_forest'),
    path('xgboost/', views.xgboost, name='xgboost'),
    path('mlp/', views.mlp_model, name='mlp'),
    path('simulator/', views.simulator, name='simulator'),  # 시뮬레이터 메인 페이지
    path('simulator/predict/', views.predict, name='predict'),  # 예측 API 엔드포인트
]
