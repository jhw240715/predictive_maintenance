from django.urls import path
from . import views

app_name = 'maintenance'

urlpatterns = [
    # Main pages
    path('', views.index, name='index'),
    path('simulator/', views.simulator, name='simulator'),
    
    # API endpoints
    path('api/predict/', views.predict_failure, name='predict_failure'),
    
    # Model comparison pages
    path('models/logistic/', views.logistic_regression, name='logistic_regression'),
    path('models/knn/', views.knn_model, name='knn'),
    path('models/svm/', views.svm_model, name='svm'),
    path('models/decision-tree/', views.decision_tree, name='decision_tree'),
    path('models/random-forest/', views.random_forest, name='random_forest'),
    path('models/xgboost/', views.xgboost_model, name='xgboost'),
]