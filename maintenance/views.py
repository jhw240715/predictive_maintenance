# maintenance/views.py
from django.shortcuts import render
from django.http import JsonResponse
import csv
import os
from django.conf import settings
import logging
import traceback
from .ml.predictor import MillingMachinePredictor
from .ml.models.config import MLConfig
from pathlib import Path
from .models import SimulatorInput, SimulatorOutput

# 로거 설정으로 디버깅과 오류 추적을 용이하게 합니다
logger = logging.getLogger(__name__)

def handle_error(error, error_type="일반 오류"):
    """공통 에러 처리 함수"""
    logger.error(f"{error_type}: {str(error)}")
    logger.error(f"상세 오류: {traceback.format_exc()}")
    return JsonResponse({
        'status': 'error',
        'message': f'{error_type}가 발생했습니다: {str(error)}'
    })

# 애플리케이션 시작 시 XGBoost 모델을 메모리에 로드합니다
try:
    model_path = Path(settings.BASE_DIR) / 'maintenance' / 'ml' / 'models' / 'model_xgboost.json'
    scaler_path = Path(settings.BASE_DIR) / 'maintenance' / 'ml' / 'models' / 'scaler_params.json'
    predictor = MillingMachinePredictor(model_path, scaler_path)
    logger.info("XGBoost 모델 로드 및 스케일러 로드 성공!")

except Exception as e:
    logger.error(f"XGBoost 모델, 스케일러 로드 실패: {str(e)}")
    predictor = None

def index(request):
    """메인 랜딩 페이지를 렌더링합니다"""
    return render(request, 'index.html')

def simulator(request):
    """시뮬레이터 페이지를 렌더링합니다"""
    context = {}
    if predictor:
        context['feature_ranges'] = MLConfig.FEATURE_CONFIG['features']
    return render(request, 'simulator.html', context)

def predict_failure(request):
    """예측 API 엔드포인트"""
    if request.method != 'POST':
        logger.error("잘못된 요청 메소드: %s", request.method)
        return JsonResponse({
            'status': 'error', 
            'message': '잘못된 요청 메소드입니다.'
        })
    
    if predictor is None:
        logger.error("ML 모델이 로드되지 않았습니다.")
        return JsonResponse({
            'status': 'error',
            'message': 'ML 모델이 로드되지 않았습니다.'
        })

    try:
        # POST 데이터 상세 로깅
        logger.info("받은 POST 데이터: %s", request.POST)
        
        # 필수 입력 필드 검증
        required_fields = [
            'type',
            'air_temperature',
            'process_temperature',
            'rotational_speed',
            'torque',
            'tool_wear'
        ]
        
        # POST 데이터 상세 로깅
        logger.info("POST 데이터 상세:")
        for field in required_fields:
            logger.info(f"{field}: {request.POST.get(field)}")
            if not request.POST.get(field):
                logger.error("필수 필드 누락: %s", field)
                return handle_error(f"필수 필드 누락: {field}", "유효성 검사 오류")
        
        try:
            # 사용자 입력값을 데이터베이스에 저장 (기본값 설정)
            simulator_input = SimulatorInput.objects.create(
                type=request.POST.get('type', 'L'),
                air_temperature=float(request.POST.get('air_temperature', 295.3)),
                process_temperature=float(request.POST.get('process_temperature', 305.7)),
                rotational_speed=int(float(request.POST.get('rotational_speed', 1168))),
                torque=float(request.POST.get('torque', 3.8)),
                tool_wear=int(float(request.POST.get('tool_wear', 0)))
            )
            logger.info("데이터베이스 저장 완료: %s", simulator_input)
            
            # 예측을 위한 입력 데이터 준비 - predictor 형식에 맞게 변환
            input_data = {
                'type': simulator_input.type,
                'Air_Temperature': simulator_input.air_temperature,
                'Process_Temperature': simulator_input.process_temperature,
                'Rotational_Speed': simulator_input.rotational_speed,
                'Torque': simulator_input.torque,
                'Tool_Wear': simulator_input.tool_wear
            }
            
            logger.info("Predictor 입력 데이터 변환: %s", input_data)
            
            # 예측 수행
            try:
                result = predictor.predict(input_data)
                logger.info("예측 성공: %s", result)
            except Exception as e:
                logger.error("예측 실패: %s", str(e))
                logger.error("입력 데이터: %s", input_data)
                return handle_error(str(e), "예측 실패")
            
            if result['status'] == 'error':
                logger.error("예측 실패: %s", result['message'])
                return JsonResponse(result)
            
            # 예측 결과의 문자열을 숫자로 변환
            prediction_value = {
                'none': 0,  # 정상 상태
                'HDF': 2,   # 열 발산 고장
                'PWF': 3,   # 전력 고장
                'OSF': 4    # 과부하 고장
            }.get(result['prediction'], 0)
            
            # 예측 결과를 데이터베이스에 저장
            simulator_output = SimulatorOutput.objects.create(
                id=simulator_input,  # OneToOne 관계로 입력값과 연결
                prediction=prediction_value
            )
            logger.info("예측 결과 저장 완료: %s", simulator_output)
            
            return JsonResponse(result)
            
        except (ValueError, TypeError) as e:
            logger.error("데이터 형식 오류: %s", str(e))
            logger.error("상세 오류: %s", traceback.format_exc())
            return handle_error(str(e), "데이터 형식 오류")
        
    except Exception as e:
        logger.error("예측 중 오류 발생: %s", str(e))
        logger.error("상세 오류: %s", traceback.format_exc())
        return handle_error(str(e), "예측 오류")

def logistic_regression(request):
    """
    로지스틱 회귀 모델의 성능 분석 결과를 보여주는 뷰 함수입니다.
    CSV 파일에서 성능 지표를 읽어와서 시각화된 결과를 제공합니다.
    """
    csv_path = os.path.join(
        settings.BASE_DIR,
        'maintenance/ml/reports/classification_report_logistic.csv'
    )

    # CSV 파일에서 성능 지표를 읽어와 백분율로 변환합니다
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

    # 성능 분석 결과를 템플릿에 전달할 컨텍스트를 준비합니다
    context = {
        'selected_model': 'logistic',
        'report_data': metrics,
        'accuracy': 87.50,
        'graph_file': 'images/graphs/roc_curve_logistic_2.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_logistic.html',
        'explanation': '로지스틱 회귀 모델의 성능 분석 결과입니다.'
    }

    return render(request, 'model_comparison.html', context)

def knn_model(request):
    """
    K-최근접 이웃 모델의 성능 분석 결과를 보여주는 뷰 함수입니다.
    CSV 파일에서 읽은 성능 지표를 시각화하여 제공합니다.
    """
    csv_path = os.path.join(
        settings.BASE_DIR,
        'maintenance/ml/reports/classification_report_knn.csv'
    )

    # 성능 지표 데이터를 읽어옵니다
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
        'accuracy': 93.78,
        'graph_file': 'images/graphs/roc_curve_knn_2.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_knn.html',
        'explanation': 'k-최근접 이웃 알고리즘 모델의 성능 분석 결과입니다.'
    }

    return render(request, 'model_comparison.html', context)

def svm_model(request):
    """
    서포트 벡터 머신(SVM) 모델의 성능 분석 결과를 보여주는 뷰 함수입니다.
    정밀도, 재현율, F1 점수 등의 성능 지표를 시각화합니다.
    """
    csv_path = os.path.join(
        settings.BASE_DIR,
        'maintenance/ml/reports/classification_report_svm.csv'
    )

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
        'accuracy': 96.46,
        'graph_file': 'images/graphs/roc_curve_svm_2.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_svm.html',
        'explanation': '서포트 벡터 머신 모델의 성능 분석 결과입니다.'
    }

    return render(request, 'model_comparison.html', context)

def decision_tree(request):
    """
    의사결정나무 모델의 성능 분석 결과를 보여주는 뷰 함수입니다.
    모델의 분류 성능을 다양한 지표로 평가하여 시각화합니다.
    """
    csv_path = os.path.join(
        settings.BASE_DIR,
        'maintenance/ml/reports/classification_report_dtc.csv'
    )

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
        'accuracy': 97.56,
        'graph_file': 'images/graphs/roc_curve_decision_tree_2.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_dtc.html',
        'explanation': '의사결정나무 모델의 성능 분석 결과입니다.'
    }

    return render(request, 'model_comparison.html', context)

def random_forest(request):
    """
    랜덤 포레스트 모델의 성능 분석 결과를 보여주는 뷰 함수입니다.
    앙상블 학습 모델의 우수한 분류 성능을 다양한 지표로 보여줍니다.
    """
    csv_path = os.path.join(
        settings.BASE_DIR,
        'maintenance/ml/reports/classification_report_rfc.csv'
    )

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
        'selected_model': 'random_forest',
        'report_data': metrics,
        'accuracy': 97.59,
        'graph_file': 'images/graphs/roc_curve_random_forest_2.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_rfc.html',
        'explanation': '랜덤 포레스트 모델의 성능 분석 결과입니다.'
    }

    return render(request, 'model_comparison.html', context)

def xgboost(request):
    """
    XGBoost 모델의 성능 분석 결과를 보여주는 뷰 함수입니다.
    그라디언트 부스팅의 강력한 성능을 다양한 지표로 시각화합니다.
    """
    csv_path = os.path.join(
        settings.BASE_DIR,
        'maintenance/ml/reports/classification_report_xgb.csv'
    )

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
        'selected_model': 'xgboost',
        'report_data': metrics,
        'accuracy': 97.46,
        'graph_file': 'images/graphs/roc_curve_xgboost_2.html',
        'matrix_file': 'images/confusion_matrix/confusion_matrix_xgb.html',
        'explanation': 'XGBoost 모델의 성능 분석 결과입니다.'
    }

    return render(request, 'model_comparison.html', context)