import joblib
import json
import pandas as pd
import numpy as np
import os
import logging
from django.conf import settings

# 로거 설정
logger = logging.getLogger(__name__)

class FailurePredictor:
    def __init__(self):
        self.model_path = os.path.join(settings.BASE_DIR, 'maintenance', 'ml', 'models')  # 경로 수정
        model_file = os.path.join(self.model_path, 'model_rfc_fix.pkl')
        
        logger.info(f"모델 파일 경로: {model_file}")
        logger.info(f"파일 존재 여부: {os.path.exists(model_file)}")
        
        try:
            # 모델 및 설정 파일 로드
            self.model = joblib.load(model_file)
            with open(os.path.join(self.model_path, 'feature_config.json'), 'r', encoding='utf-8') as f:
                self.feature_config = json.load(f)
            
            logger.info("모델 정보:")
            logger.info(f"- 타입: {type(self.model)}")
            logger.info(f"- 특성 개수: {self.model.n_features_in_}")
            
            # 모델의 feature 이름 확인 및 로깅
            if hasattr(self.model, 'feature_names_in_'):
                logger.info("모델의 feature 이름:")
                for name in self.model.feature_names_in_:
                    logger.info(f"- {name}")
            
        except Exception as e:
            logger.error(f"모델 로드 중 오류 발생: {str(e)}")
            raise

        # 고장 유형 정의
        self.failure_types = {
            0: '정상',
            1: '공구 마모 실패',
            2: '열 발산 실패',
            3: '전력 고장',
            4: '제품 과변형'
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
            logger.info("처리된 입력 데이터: %s", features)
            
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
            logger.info("예측 결과: %s", result)
            return result
            
        except Exception as e:
            logger.error("예측 중 오류 발생: %s", str(e))
            raise 