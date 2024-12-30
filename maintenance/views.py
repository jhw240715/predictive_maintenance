# maintenance/views.py
from django.shortcuts import render
from django.http import JsonResponse
import csv
import os
from django.conf import settings
import logging
import traceback
from .ml.predictor import FailurePredictor

# 로거 설정
logger = logging.getLogger(__name__)

def handle_error(error, error_type="일반 오류"):
    """공통 에러 처리 함수"""
    logger.error(f"{error_type}: {str(error)}")
    logger.error(f"상세 오류: {traceback.format_exc()}")
    return JsonResponse({
        'status': 'error',
        'message': f'{error_type}가 발생했습니다: {str(error)}'
    })

# 모델 인스턴스 생성
try:
    predictor = FailurePredictor()
    logger.info("RandomForest 모델 로드 성공!")
except Exception as e:
    logger.error(f"RandomForest 모델 로드 실패: {str(e)}")
    predictor = None

def index(request):
    """메인 랜딩 페이지"""
    return render(request, 'index.html')

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

    accuracy = 94.81
    context = {
        'selected_model': 'logistic',
        'report_data': metrics,
        'accuracy': accuracy,
        'graph_file': 'images/graphs/roc_curve_logistic.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_logistic.html',
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

    accuracy = 98.56
    context = {
        'selected_model': 'knn',
        'report_data': metrics,
        'accuracy': accuracy,
        'graph_file': 'images/graphs/roc_curve_knn.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_knn.html',
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

    accuracy = 99.16
    context = {
        'selected_model': 'svm',
        'report_data': metrics,
        'accuracy': accuracy,
        'graph_file': 'images/graphs/roc_curve_svm.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_svm.html',
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

    accuracy = 99.42
    context = {
        'selected_model': 'decision_tree',
        'report_data': metrics,
        'accuracy': accuracy,
        'graph_file': 'images/graphs/roc_curve_decision_tree.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_decision_tree.html',
        'explanation': '의사결정나무 모델의 성능 분석 결과입니다.'
    }

    return render(request, 'model_comparison.html', context)

def random_forest(request):
    # csv 파일 경로 설정
    csv_path = os.path.join(
        settings.BASE_DIR,
        'maintenance/ml/reports/rfc_classification_report.csv'
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

    accuracy = 99.57
    context = {
        'selected_model': 'random_forest',
        'report_data': metrics,
        'accuracy': accuracy,
        'graph_file': 'images/graphs/roc_curve_random_forest.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_random_forest.html',
        'explanation': '랜덤 포레스트 모델의 성능 분석 결과입니다.'
    }

    return render(request, 'model_comparison.html', context)

def xgboost(request):
    # csv 파일 경로 설정
    csv_path = os.path.join(
        settings.BASE_DIR,
        'maintenance/ml/reports/xgb_classification_report.csv'
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

    accuracy = 99.52
    context = {
        'selected_model': 'xgboost',
        'report_data': metrics,
        'accuracy': accuracy,
        'graph_file': 'images/graphs/roc_curve_xgboost.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_xgboost.html',
        'explanation': 'XGBoost 모델의 성능 분석 결과입니다.'
    }

    return render(request, 'model_comparison.html', context)

def simulator(request):
    """시뮬레이터 메인 페이지"""
    context = {}
    if predictor:
        context['feature_ranges'] = predictor.feature_config['features']
    return render(request, 'simulator.html', context)

def predict_failure(request):
    """예측 API 엔드포인트"""
    if request.method != 'POST':
        return JsonResponse({
            'status': 'error', 
            'message': '잘못된 요청 메소드입니다.'
        })
    
    if predictor is None:
        return JsonResponse({
            'status': 'error',
            'message': 'ML 모델이 로드되지 않았습니다.'
        })

    try:
        logger.info("받은 POST 데이터: %s", request.POST)
        
        # POST 데이터 유효성 검사
        required_fields = [
            'Rotational_Speed', 'Torque', 'Tool_Wear',
            'Type_encoded', 'Temperature_difference',
            'Power', 'Wear_degree'
        ]
        
        for field in required_fields:
            if not request.POST.get(field):
                return handle_error(f"필수 필드 누락: {field}", "유효성 검사 오류")
        
        # 입력 데이터 준비
        try:
            # 모델이 학습할 때 사용한 정확한 feature 이름으로 매핑
            input_data = {
                'Rotational speed [rpm]': float(request.POST.get('Rotational_Speed')),
                'Torque [Nm]': float(request.POST.get('Torque')),
                'Tool wear [min]': float(request.POST.get('Tool_Wear')),
                'Type_encoded': int(request.POST.get('Type_encoded')),
                'Temperature difference [K]': float(request.POST.get('Temperature_difference')),
                'Power [W]': float(request.POST.get('Power')),
                'Wear degree [min*Nm]': float(request.POST.get('Wear_degree'))
            }
            
            logger.info("변환된 입력 데이터: %s", input_data)
            
            # 모델의 feature 이름 확인 및 로깅
            if hasattr(predictor.model, 'feature_names_in_'):
                logger.info("모델의 feature 이름:")
                for name in predictor.model.feature_names_in_:
                    logger.info(f"- {name}")
            
            # 예측 수행
            result = predictor.predict(input_data)
            return JsonResponse(result)
            
        except (ValueError, TypeError) as e:
            return handle_error(str(e), "데이터 형식 오류")
        
    except Exception as e:
        return handle_error(str(e), "예측 오류")