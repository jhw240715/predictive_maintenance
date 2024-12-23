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
    # csv 파일 경로 설정
    csv_path = os.path.join(
        settings.BASE_DIR,
        'maintenance/ml/reports/logistic_classification_report.csv'
    )

    # csv 파일 읽기
    metrics = []
    with open(csv_path,'r',encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            metrics.append({
                'name': row['name'],
                'precision': float(row['precision'])*100,
                'recall': float(row['recall'])*100,
                'f1_score': float(row['f1_score'])*100,
            })


    context = {
        'selected_model': 'logistic',
        'report_data': metrics,
        'explanation': '로지스틱 회귀 모델의 성능 분석 결과입니다.'
    }

    return render(request, 'model_comparison.html', context)

def knn_model(request):
    # csv 파일 경로 설정
    csv_path = os.path.join(
        settings.BASE_DIR,
        'maintenance/ml/reports/knn_classification_report.csv'
    )

    # csv 파일 읽기
    metrics = []
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            metrics.append({
                'name': row['name'],
                'precision': float(row['precision']) * 100,
                'recall': float(row['recall']) * 100,
                'f1_score': float(row['f1_score']) * 100,
            })

    context = {
        'selected_model': 'knn',
        'report_data': metrics,
        'explanation': 'k-최근접 이웃 알고리즘 모델의 성능 분석 결과입니다.'
    }

    return render(request, 'model_comparison.html', context)

def svm_model(request):
    # csv 파일 경로 설정
    csv_path = os.path.join(
        settings.BASE_DIR,
        'maintenance/ml/reports/svm_classification_report.csv'
    )

    # csv 파일 읽기
    metrics = []
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            metrics.append({
                'name': row['name'],
                'precision': float(row['precision']) * 100,
                'recall': float(row['recall']) * 100,
                'f1_score': float(row['f1_score']) * 100,
            })

    context = {
        'selected_model': 'svm',
        'report_data': metrics,
        'explanation': '서포트 벡터 머신 모델의 성능 분석 결과입니다.'
    }

    return render(request, 'model_comparison.html', context)

def decision_tree(request):
    # csv 파일 경로 설정
    csv_path = os.path.join(
        settings.BASE_DIR,
        'maintenance/ml/reports/dtc_classification_report.csv'
    )

    # csv 파일 읽기
    metrics = []
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            metrics.append({
                'name': row['name'],
                'precision': float(row['precision']) * 100,
                'recall': float(row['recall']) * 100,
                'f1_score': float(row['f1_score']) * 100,
            })

    context = {
        'selected_model': 'decision_tree',
        'report_data': metrics,
        'explanation': '의사결정나무 모델의 성능 분석 결과입니다.'
    }

    return render(request, 'model_comparison.html', context)


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