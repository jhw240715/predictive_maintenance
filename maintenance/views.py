# maintenance/views.py
from django.shortcuts import render

def main_page(request):
    return render(request, 'main.html')

def model_result(request, model_name):
    context = {
        'accuracy': '85.5%',
        'precision': '88.9%',
        'f1_score': '87.2%',
        'recall': '86.7%',
        'selected_model': model_name
    }
    return render(request, 'model_comparison.html', context)

def logistic_regression(request):
    return model_result(request, 'logistic')

def knn_model(request):
    return model_result(request, 'knn')

def svm_model(request):
    return model_result(request, 'svm')

def decision_tree(request):
    return model_result(request, 'decision_tree')


def random_forest(request):
    return model_result(request, 'random_forest')

def xgboost(request):
    return model_result(request, 'xgboost')

def mlp_model(request):
    return model_result(request, 'mlp')