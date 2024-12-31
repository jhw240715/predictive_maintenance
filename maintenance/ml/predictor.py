import numpy as np
import joblib
from .config import MLConfig

class MillingMachinePredictor:
    def __init__(self, model_path):
        """
        예측기 초기화
        Args:
            model_path: 학습된 XGBoost 모델의 경로
        """
        self.model = joblib.load(model_path)
        self.config = MLConfig()
        # 고장 유형 매핑 정의
        self.failure_types = {
            0: 'none',    # 정상 상태
            1: 'TWF',     # Tool Wear Failure (공구 마모 고장)
            2: 'HDF',     # Heat Dissipation Failure (열 발산 고장)
            3: 'PWF',     # Power Failure (전력 고장)
            4: 'OSF'      # Overstrain Failure (과부하 고장)
        }

    def validate_input(self, input_data):
        """
        입력 데이터 유효성 검사
        Args:
            input_data: 검사할 입력 데이터 딕셔너리
        Raises:
            ValueError: 유효하지 않은 입력값 발견 시
        """
        for feature, config in self.config.FEATURE_CONFIG['features'].items():
            if feature not in input_data:
                raise ValueError(f"Missing required feature: {feature}")
            
            value = input_data[feature]
            if feature == 'type':
                if value not in config['options']:
                    raise ValueError(f"Invalid type value. Must be one of {config['options']}")
            else:
                try:
                    value = float(value)
                    if value < config['min'] or value > config['max']:
                        raise ValueError(
                            f"Value for {feature} must be between "
                            f"{config['min']} and {config['max']} {config['unit']}"
                        )
                except ValueError:
                    raise ValueError(f"Invalid value for {feature}")

    def predict(self, input_data):
        """
        입력 데이터를 기반으로 고장 예측 수행
        Args:
            input_data: 예측을 위한 입력 데이터 딕셔너리
        Returns:
            prediction_result: 예측 결과를 포함한 딕셔너리
        """
        # 입력 데이터 검증
        self.validate_input(input_data)
        
        # 파생 특성 계산
        derived_features = self.config.calculate_derived_features(input_data)
        
        # 특성 벡터 생성
        features = np.array([
            derived_features[feature_name] 
            for feature_name in self.config.FEATURE_NAMES
        ]).reshape(1, -1)
        
        # 예측 수행
        prediction_idx = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]
        
        # 예측 결과를 문자열로 변환
        prediction = self.failure_types[prediction_idx]
        
        # 응답 준비
        response = {
            'prediction': prediction,
            'failure_type': prediction,
            'probabilities': {
                self.failure_types[i]: float(prob)
                for i, prob in enumerate(probabilities)
            },
            'input_parameters': input_data,
            'derived_features': derived_features
        }
        
        # 컴포넌트 상태 추가
        response['component_status'] = self.get_component_status(prediction)
        
        return response

    def get_component_status(self, failure_type):
        """
        예측된 고장 유형에 따른 컴포넌트 상태 반환
        Args:
            failure_type: 예측된 고장 유형
        Returns:
            component_status: 각 컴포넌트의 상태를 포함한 딕셔너리
        """
        component_status = {
            'tool': 'normal',
            'cooling_system': 'normal',
            'power_system': 'normal',
            'mechanical_system': 'normal'
        }
        
        if failure_type == 'TWF':
            component_status['tool'] = 'error'
        elif failure_type == 'HDF':
            component_status['cooling_system'] = 'error'
        elif failure_type == 'PWF':
            component_status['power_system'] = 'error'
        elif failure_type == 'OSF':
            component_status['mechanical_system'] = 'error'
            
        return component_status 