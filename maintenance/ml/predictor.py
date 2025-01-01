import joblib
import numpy as np
import pandas as pd
from .models.config import MLConfig

class MillingMachinePredictor:
    """밀링 머신의 고장을 예측하는 클래스입니다.
    이 클래스는 실시간으로 측정되는 작동 파라미터를 기반으로 잠재적인 고장을 예측합니다."""

    def __init__(self, model_path):
        """예측기를 초기화합니다. 모델 파일을 로드하고 필요한 상수들을 정의합니다."""
        self.model = joblib.load(model_path)
        self.config = MLConfig
        
        # 온도차 제약조건을 정의합니다
        self.TEMP_DIFF_MIN = 7.6
        self.TEMP_DIFF_MAX = 12.1
        
        # 각 고장 유형별 임계값을 정의합니다
        self.FAILURE_THRESHOLDS = {
            'HDF': 11.0,    # 열 발산 고장: 온도차 11.0K 이상
            'PWF': 20000,   # 전력 고장: 20kW 이상 (임계값 조정)
            'OSF': 180      # 과변형 고장: 공구 마모 180분 이상
        }
        
        # 모델 입력에 필요한 특성들의 순서를 정의합니다
        self.REQUIRED_FEATURES = [
            'Type_encoded',
            'Rotational speed [rpm]',
            'Tool wear [min]',
            'Temperature difference [K]',
            'Power [W]',
            'Wear degree [min*Nm]'
        ]

    def calculate_power(self, speed, torque):
        """회전 속도와 토크로부터 전력을 계산합니다.
        전력(W) = 2π × 회전속도(rps) × 토크(Nm)"""
        return 2 * np.pi * (speed / 60) * torque

    def check_failure_type(self, temp_diff, power, tool_wear):
        """현재 상태가 어떤 고장 조건에 해당하는지 확인합니다.
        
        고장 우선순위:
        1. 전력 고장 (PWF) - 가장 심각한 문제
        2. 과변형 고장 (OSF) - 공구 교체 필요
        3. 열 발산 고장 (HDF) - 냉각 시스템 문제
        """
        if power >= self.FAILURE_THRESHOLDS['PWF']:
            return 'PWF'  # 전력이 임계값을 초과하면 전력 고장
        elif tool_wear >= self.FAILURE_THRESHOLDS['OSF']:
            return 'OSF'  # 공구 마모가 임계값을 초과하면 과변형 고장
        elif temp_diff >= self.FAILURE_THRESHOLDS['HDF']:
            return 'HDF'  # 온도차가 임계값을 초과하면 열 발산 고장
        return 'none'     # 모든 값이 정상 범위 내에 있음

    def preprocess_input(self, input_data):
        """입력 데이터를 전처리하여 모델이 예측할 수 있는 형태로 변환합니다."""
        try:
            print("입력 데이터:", input_data)
            
            # 기본 특성들을 추출하고 숫자로 변환합니다
            air_temp = float(input_data['Air_Temperature'])
            process_temp = float(input_data['Process_Temperature'])
            rotational_speed = float(input_data['Rotational_Speed'])
            torque = float(input_data['Torque'])
            tool_wear = float(input_data['Tool_Wear'])
            
            # 온도차를 계산하고 검증합니다
            temp_diff = process_temp - air_temp
            if temp_diff <= 0:
                raise ValueError("공정 온도는 반드시 공기 온도보다 높아야 합니다")
            if not (self.TEMP_DIFF_MIN <= temp_diff <= self.TEMP_DIFF_MAX):
                raise ValueError(f"온도차는 {self.TEMP_DIFF_MIN}K에서 {self.TEMP_DIFF_MAX}K 사이여야 합니다")
            
            # 파생 특성들을 계산합니다
            power = self.calculate_power(rotational_speed, torque)
            wear_degree = tool_wear * torque
            
            # 데이터프레임을 생성하고 스케일링을 적용합니다
            scaled_data = {
                'Type_encoded': 0 if input_data['type'] == 'L' else 1 if input_data['type'] == 'M' else 2,
                'Rotational speed [rpm]': (rotational_speed - 1168) / (2886 - 1168),
                'Tool wear [min]': tool_wear / 200,
                'Temperature difference [K]': (temp_diff - self.TEMP_DIFF_MIN) / (self.TEMP_DIFF_MAX - self.TEMP_DIFF_MIN),
                'Power [W]': power / self.calculate_power(2886, 76.6),
                'Wear degree [min*Nm]': wear_degree / (200 * 76.6)
            }
            
            # 특성 순서를 맞춰 데이터프레임을 생성합니다
            df = pd.DataFrame([scaled_data])
            df = df[self.REQUIRED_FEATURES]
            
            print("전처리된 데이터:", df)
            return df

        except Exception as e:
            print(f"전처리 중 오류 발생: {str(e)}")
            raise

    def predict(self, input_data):
        """입력 데이터를 기반으로 고장 유형을 예측합니다."""
        try:
            print("예측 시작 - 입력 데이터:", input_data)
            
            # 데이터를 전처리합니다
            processed_data = self.preprocess_input(input_data)
            print("전처리된 데이터 shape:", processed_data.shape)

            # 실제 물리값들을 계산합니다
            temp_diff = float(input_data['Process_Temperature']) - float(input_data['Air_Temperature'])
            power = self.calculate_power(float(input_data['Rotational_Speed']), float(input_data['Torque']))
            tool_wear = float(input_data['Tool_Wear'])
            
            # 고장 유형을 확인합니다
            failure_type = self.check_failure_type(temp_diff, power, tool_wear)
            
            # 모델의 예측 확률을 구합니다
            probabilities = self.model.predict_proba(processed_data)[0]
            
            print("계산된 값들:")
            print(f"온도차: {temp_diff:.1f}K")
            print(f"전력: {power:.1f}W")
            print(f"공구 마모: {tool_wear}min")
            print("최종 예측:", failure_type)
            
            return {
                'status': 'success',
                'prediction': failure_type,
                'probabilities': {
                    'none': float(probabilities[0]),
                    'HDF': float(probabilities[2]),
                    'PWF': float(probabilities[3]),
                    'OSF': float(probabilities[4])
                },
                'calculated_values': {
                    'temp_difference': temp_diff,
                    'power': power,
                    'tool_wear': tool_wear
                }
            }

        except Exception as e:
            print(f"예측 중 오류 발생: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }