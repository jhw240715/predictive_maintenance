from django.shortcuts import render
from django.http import JsonResponse
import csv
import os
from django.conf import settings
import logging
import traceback
from pathlib import Path
from .ml.predictor import MillingMachinePredictor
from .ml.config import MLConfig

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
    model_path = Path(__file__).resolve().parent / 'ml' / 'models' / 'random_forest_model.joblib'
    predictor = MillingMachinePredictor(model_path)
    config = MLConfig()
    logger.info("Random Forest 모델 로드 성공!")
except Exception as e:
    logger.error(f"Random Forest 모델 로드 실패: {str(e)}")
    predictor = None

def load_model_metrics(model_name):
    """모델 메트릭스 로드 공통 함수"""
    base_dir = Path(__file__).resolve().parent
    csv_path = base_dir / 'ml' / 'reports' / f'{model_name}_classification_report.csv'
    
    metrics = []
    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                metrics.append({
                    'name': row['name'],
                    'precision': float(row['precision'])*100,
                    'recall': float(row['recall'])*100,
                    'f1_score': float(row['f1_score'])*100,
                })
    except Exception as e:
        logger.error(f"Error loading metrics for {model_name}: {str(e)}")
        metrics = []
        
    return metrics

def index(request):
    """메인 랜딩 페이지"""
    context = {
        'title': 'QR Code - 제조 데이터 분석',
        'description': '밀링 머신의 고장 예측 및 분석'
    }
    return render(request, 'index.html', context)

def simulator(request):
    """시뮬레이터 메인 페이지"""
    context = {}
    if predictor:
        context['feature_config'] = config.FEATURE_CONFIG['features']
        context['failure_types'] = config.FAILURE_TYPES
    return render(request, 'simulator.html', context)

def predict_failure(request):
    """예측 API 엔드포인트"""
    if request.method != 'POST':
        return JsonResponse({
            'status': 'error', 
            'message': '잘못된 요청 메소드입니다.'
        })
    
    try:
        input_data = {
            'type': request.POST.get('type'),
            'Air_Temperature': float(request.POST.get('Air_Temperature')),
            'Process_Temperature': float(request.POST.get('Process_Temperature')),
            'Rotational_Speed': float(request.POST.get('Rotational_Speed')),
            'Torque': float(request.POST.get('Torque')),
            'Tool_Wear': float(request.POST.get('Tool_Wear'))
        }
        
        prediction_result = predictor.predict(input_data)
        component_status = predictor.get_component_status(prediction_result)
        
        response = {
            'status': 'success',
            'prediction': prediction_result['prediction'],
            'failure_info': prediction_result['failure_info'],
            'component_status': component_status,
            'probabilities': prediction_result['probabilities']
        }
        return JsonResponse(response)

    except ValueError as ve:
        return handle_error(str(ve), "데이터 형식 오류")
    except Exception as e:
        return handle_error(str(e), "예측 오류")

def logistic_regression(request):
    """로지스틱 회귀 모델 결과 페이지"""
    context = {
        'selected_model': 'logistic',
        'report_data': load_model_metrics('logistic'),
        'accuracy': 94.81,
        'graph_file': 'images/graphs/roc_curve_logistic.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_logistic.html',
        'explanation': '로지스틱 회귀 모델의 성능 분석 결과입니다.'
    }
    return render(request, 'model_comparison.html', context)

def knn_model(request):
    """KNN 모델 결과 페이지"""
    context = {
        'selected_model': 'knn',
        'report_data': load_model_metrics('knn'),
        'accuracy': 98.56,
        'graph_file': 'images/graphs/roc_curve_knn.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_knn.html',
        'explanation': 'k-최근접 이웃 알고리즘 모델의 성능 분석 결과입니다.'
    }
    return render(request, 'model_comparison.html', context)

def svm_model(request):
    """SVM 모델 결과 페이지"""
    context = {
        'selected_model': 'svm',
        'report_data': load_model_metrics('svm'),
        'accuracy': 99.16,
        'graph_file': 'images/graphs/roc_curve_svm.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_svm.html',
        'explanation': '서포트 벡터 머신 모델의 성능 분석 결과입니다.'
    }
    return render(request, 'model_comparison.html', context)

def decision_tree(request):
    """의사결정나무 모델 결과 페이지"""
    context = {
        'selected_model': 'decision_tree',
        'report_data': load_model_metrics('dtc'),
        'accuracy': 99.42,
        'graph_file': 'images/graphs/roc_curve_decision_tree.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_decision_tree.html',
        'explanation': '의사결정나무 모델의 성능 분석 결과입니다.'
    }
    return render(request, 'model_comparison.html', context)

def random_forest(request):
    """랜덤 포레스트 모델 결과 페이지"""
    context = {
        'selected_model': 'random_forest',
        'report_data': load_model_metrics('rfc'),
        'accuracy': 99.57,
        'graph_file': 'images/graphs/roc_curve_random_forest.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_random_forest.html',
        'explanation': '랜덤 포레스트 모델의 성능 분석 결과입니다.'
    }
    return render(request, 'model_comparison.html', context)

def xgboost_model(request):
    """XGBoost 모델 결과 페이지"""
    context = {
        'selected_model': 'xgboost',
        'report_data': load_model_metrics('xgb'),
        'accuracy': 99.52,
        'graph_file': 'images/graphs/roc_curve_xgboost.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_xgboost.html',
        'explanation': 'XGBoost 모델의 성능 분석 결과입니다.'
    }
    return render(request, 'model_comparison.html', context)