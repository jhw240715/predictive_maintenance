# maintenance/views.py
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import SimulatorInput, SimulatorOutput
import joblib
import numpy as np
from datetime import datetime

def main_page(request):
    return render(request, 'main.html')

def model_result(request, model_name):
    context = {
        'accuracy': '123%',
        'precision': '123%',
        'f1_score': '123%',
        'recall': '123%',
        'selected_model': model_name
    }
    return render(request, 'model_comparison.html', context)

def logistic_regression(request):
    return model_result(request, 'logistic')

def knn_model(request):
    # KNN 모델 학습 및 평가
    knn = KNNModel()
    metrics = knn.train_and_evaluate()
    
    context = {
        'selected_model': 'knn',
        'metrics': metrics,
        'explanation': 'KNN 모델의 성능 분석 결과입니다.'
    }
    return render(request, 'model_comparison.html', context)

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


def simulator(request):
    """시뮬레이터 페이지 뷰"""
    return render(request, 'simulator/simulator.html')

def simulator(request):
    """시뮬레이터 페이지"""
    return render(request, 'simulator/simulator.html')

@csrf_exempt
def predict(request):
    """예측 API"""
    if request.method == 'POST':
        try:
            input_data = SimulatorInput.objects.create(
                type=request.POST.get('machine_type'),
                air_temperature=float(request.POST.get('air_temperature')),
                process_temperature=float(request.POST.get('process_temperature')),
                rotational_speed=int(request.POST.get('rotational_speed')),
                torque=float(request.POST.get('torque')),
                tool_wear=int(request.POST.get('tool_wear'))
            )

            # XGBoost 모델로 예측
            model = joblib.load('maintenance/ml/models/xgboost_model.pkl')
            features = np.array([[
                input_data.air_temperature,
                input_data.process_temperature,
                input_data.rotational_speed,
                input_data.torque,
                input_data.tool_wear
            ]])
            prediction = model.predict(features)[0]
            probability = model.predict_proba(features)[0].max()

            # 결과 저장
            output_data = SimulatorOutput.objects.create(
                input_data=input_data,
                prediction=prediction
            )

            return JsonResponse({
                'status': 'success',
                'prediction': prediction,
                'probability': float(probability)
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=400)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)