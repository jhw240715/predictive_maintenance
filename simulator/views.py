# simulator/views.py

import joblib
import json
import pandas as pd
import numpy as np
import os
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
import traceback

class FailurePredictor:
    def __init__(self):
        self.model_path = os.path.join(settings.BASE_DIR, 'simulator', 'ml_models')
        model_file = os.path.join(self.model_path, 'xgboost_model.pkl')
        
        print(f"모델 파일 경로: {model_file}")
        print(f"파일 존재 여부: {os.path.exists(model_file)}")
        
        try:
            # 모델 및 설정 파일 로드
            self.model = joblib.load(model_file)
            with open(os.path.join(self.model_path, 'feature_config.json'), 'r') as f:
                self.feature_config = json.load(f)
            
            print("모델 정보:")
            print(f"- 타입: {type(self.model)}")
            print(f"- 특성 개수: {self.model.n_features_in_}")
            
        except Exception as e:
            print(f"모델 로드 중 오류 발생: {str(e)}")
            raise

        # 고장 유형 매핑 정의
        self.failure_types = {
            0: 'No Failure',
            1: 'TWF',
            2: 'HDF',
            3: 'PWF',
            4: 'OSF'
        }

    def validate_input(self, input_data):
        """입력 데이터 검증"""
        for feature, value in input_data.items():
            if feature in self.feature_config['features']:
                feature_range = self.feature_config['features'][feature]
                if value < feature_range['min'] or value > feature_range['max']:
                    raise ValueError(
                        f"{feature}의 값이 허용 범위를 벗어났습니다. "
                        f"(허용 범위: {feature_range['min']} ~ {feature_range['max']})"
                    )

    def predict(self, input_data):
        """예측 수행"""
        try:
            # 입력 데이터 검증
            self.validate_input(input_data)
            
            # 입력 데이터 변환
            features = pd.DataFrame([input_data])
            print("처리된 입력 데이터:", features)
            
            # 예측 수행
            prediction = self.model.predict(features)[0]
            probabilities = self.model.predict_proba(features)[0]
            
            result = {
                'status': 'success',
                'prediction': self.failure_types[prediction],
                'predicted_class': int(prediction),
                'probabilities': {
                    self.failure_types[i]: float(prob)
                    for i, prob in enumerate(probabilities)
                }
            }
            print("예측 결과:", result)
            return result
            
        except Exception as e:
            print("예측 중 오류 발생:", str(e))
            print("상세 오류:", traceback.format_exc())
            raise

# 모델 인스턴스 생성
try:
    predictor = FailurePredictor()
    print("XGBoost 모델 로드 성공!")
except Exception as e:
    print(f"XGBoost 모델 로드 실패: {str(e)}")
    predictor = None

def simulator_main(request):
    """시뮬레이터 메인 페이지"""
    context = {}
    if predictor:
        context['feature_ranges'] = predictor.feature_config['features']
    return render(request, 'simulator/simulator.html', context)

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
        print("받은 POST 데이터:", request.POST)
        
        # POST 데이터 유효성 검사
        required_fields = [
            'Rotational_Speed', 'Torque', 'Tool_Wear',
            'Type_encoded', 'Temperature_difference',
            'Power', 'Wear_degree'
        ]
        
        for field in required_fields:
            if not request.POST.get(field):
                return JsonResponse({
                    'status': 'error',
                    'message': f'필수 필드 누락: {field}'
                })
        
        # 입력 데이터 준비
        try:
            input_data = {
                'Rotational_speed': float(request.POST.get('Rotational_Speed')),
                'Torque': float(request.POST.get('Torque')),
                'Tool_wear': float(request.POST.get('Tool_Wear')),
                'Type_encoded': int(request.POST.get('Type_encoded')),
                'Temperature_difference': float(request.POST.get('Temperature_difference')),
                'Power': float(request.POST.get('Power')),
                'Wear_degree': float(request.POST.get('Wear_degree'))
            }
        except (ValueError, TypeError) as e:
            return JsonResponse({
                'status': 'error',
                'message': f'데이터 형식 오류: {str(e)}'
            })
        
        print("변환된 입력 데이터:", input_data)
        
        # 예측 수행
        result = predictor.predict(input_data)
        return JsonResponse(result)

    except Exception as e:
        print("예측 중 오류:", str(e))
        print("상세 오류:", traceback.format_exc())
        return JsonResponse({
            'status': 'error',
            'message': f'예측 중 오류가 발생했습니다: {str(e)}'
        })
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
        print("받은 POST 데이터:", request.POST)
        
        # 입력 데이터 준비
        input_data = {
            'Rotational_speed': float(request.POST.get('Rotational_Speed')),
            'Torque': float(request.POST.get('Torque')),
            'Tool_wear': float(request.POST.get('Tool_Wear')),
            'Type_encoded': int(request.POST.get('Type_encoded')),
            'Temperature_difference': float(request.POST.get('Temperature_difference')),
            'Power': float(request.POST.get('Power')),
            'Wear_degree': float(request.POST.get('Wear_degree'))
        }
        
        print("변환된 입력 데이터:", input_data)
        
        # 예측 수행
        result = predictor.predict(input_data)
        return JsonResponse(result)

    except ValueError as e:
        return JsonResponse({
            'status': 'error',
            'message': f'잘못된 데이터 형식: {str(e)}'
        })
    except Exception as e:
        print("예측 중 오류:", str(e))
        print("상세 오류:", traceback.format_exc())
        return JsonResponse({
            'status': 'error',
            'message': f'예측 중 오류가 발생했습니다: {str(e)}'
        })