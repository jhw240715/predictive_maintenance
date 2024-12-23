# simulator/ml_models/predictor.py

import joblib
import json
import pandas as pd
import numpy as np
import os
from django.conf import settings

class FailurePredictor:
    """
    기계 고장 예측을 위한 클래스입니다.
    학습된 XGBoost 모델을 로드하고 새로운 데이터에 대한 예측을 수행합니다.
    """
    def __init__(self):
        # 모델 파일들이 있는 디렉토리 경로 설정
        self.model_path = os.path.join(settings.BASE_DIR, 'simulator', 'ml_models')
        
        # 학습된 모델 로드
        self.model = joblib.load(os.path.join(self.model_path, 'xgboost_model.pkl'))
        
        # 특성 구성 정보 로드
        with open(os.path.join(self.model_path, 'feature_config.json'), 'r') as f:
            self.feature_config = json.load(f)
        
        # 고장 유형 매핑 정의
        self.failure_types = {
            0: 'No Failure',
            1: 'TWF',  # Tool Wear Failure
            2: 'HDF',  # Heat Dissipation Failure
            3: 'PWF',  # Power Failure
            4: 'OSF'   # Overstrain Failure
        }
    
    def validate_input(self, input_data):
        """
        입력 데이터가 허용된 범위 내에 있는지 검증합니다.
        
        Args:
            input_data (dict): 검증할 입력 데이터
            
        Returns:
            tuple: (검증 통과 여부, 오류 메시지)
        """
        for feature, value in input_data.items():
            if feature in self.feature_config['features']:
                feature_range = self.feature_config['features'][feature]
                if value < feature_range['min'] or value > feature_range['max']:
                    return False, f"{feature}의 값이 허용 범위를 벗어났습니다. (허용 범위: {feature_range['min']} ~ {feature_range['max']})"
        return True, None

    def predict(self, input_data):
        """
        새로운 데이터에 대한 고장 유형을 예측합니다.
        
        Args:
            input_data (dict): 예측을 위한 입력 데이터
                {
                    'Rotational_speed': float,
                    'Torque': float,
                    'Tool_wear': float,
                    'Type_encoded': int,
                    'Temperature_difference': float,
                    'Power': float,
                    'Wear_degree': float
                }
                
        Returns:
            dict: 예측 결과와 각 고장 유형별 확률
        """
        # 입력 데이터 검증
        is_valid, error_message = self.validate_input(input_data)
        if not is_valid:
            raise ValueError(error_message)
            
        # 입력 데이터를 DataFrame으로 변환
        features = pd.DataFrame([input_data])
        
        # 예측 수행
        prediction = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]
        
        # 결과 반환
        return {
            'prediction': self.failure_types[prediction],
            'predicted_class': int(prediction),
            'probabilities': {
                self.failure_types[i]: float(prob)
                for i, prob in enumerate(probabilities)
            }
        }

    def get_feature_ranges(self):
        """
        입력 특성들의 허용 범위를 반환합니다.
        웹 인터페이스에서 입력 폼의 유효성 검사에 사용됩니다.
        """
        return self.feature_config