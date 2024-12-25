# maintenance/views.py
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import SimulatorInput, SimulatorOutput
import joblib
import numpy as np
from datetime import datetime
import json
import csv
import os
from django.conf import settings

def index(request):
    """메인 랜딩 페이지"""
    return render(request, 'index.html')

def quality_main(request):
    """품질 분석 메인 페이지"""
    return render(request, 'quality_main.html')

def model_result(request, model_name):
    model_info = {
        'logistic': {
            'name': 'logistic',
            'file': 'logistic_classification_report.csv',
            'explanation': '로지스틱 회귀 모델의 성능 분석 결과입니다.'
        },
        'knn': {
            'name': 'knn',
            'file': 'knn_classification_report.csv',
            'explanation': 'k-최근접 이웃 알고리즘 모델의 성능 분석 결과입니다.'
        },
        'svm': {
            'name': 'svm',
            'file': 'svm_classification_report.csv',
            'explanation': '서포트 벡터 머신 모델의 성능 분석 결과입니다.'
        },
        'decision_tree': {
            'name': 'decision_tree',
            'file': 'dtc_classification_report.csv',
            'explanation': '의사결정나무 모델의 성능 분석 결과입니다.'
        },
        'random_forest': {
            'name': 'random_forest',
            'file': 'rfc_classification_report.csv',
            'explanation': '랜덤 포레스트 모델의 성능 분석 결과입니다.'
        },
        'xgboost': {
            'name': 'xgboost',
            'file': 'xgb_classification_report.csv',
            'explanation': 'XGBoost 모델의 성능 분석 결과입니다.'
        }
    }

    try:
        csv_path = os.path.join(
            settings.BASE_DIR,
            'maintenance/ml/reports/',
            model_info[model_name]['file']
        )

        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            data = list(reader)
            # accuracy는 마지막 행의 'accuracy' 값
            accuracy = float(data[-1].get('accuracy', 0)) * 100
            # 나머지 지표들은 'weighted avg' 행의 값들
            weighted_avg = next(row for row in data if row['name'] == 'weighted avg')
            
            context = {
                'selected_model': model_name,
                'accuracy': accuracy,
                'precision': float(weighted_avg['precision']) * 100,
                'recall': float(weighted_avg['recall']) * 100,
                'f1_score': float(weighted_avg['f1_score']) * 100,
                'explanation': model_info[model_name]['explanation']
            }
            
            return render(request, 'model_comparison.html', context)
            
    except Exception as e:
        # 에러 발생시 기본값 반환
        context = {
            'selected_model': model_name,
            'accuracy': 0,
            'precision': 0,
            'recall': 0,
            'f1_score': 0,
            'explanation': f'모델 데이터를 불러오는 중 오류가 발생했습니다: {str(e)}'
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