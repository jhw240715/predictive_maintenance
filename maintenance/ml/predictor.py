import json
import numpy as np
import pandas as pd
from .models.config import MLConfig
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

class MillingMachinePredictor:
    """밀링 머신의 고장을 예측하는 클래스입니다.
    이 클래스는 실시간으로 측정되는 작동 파라미터를 기반으로 잠재적인 고장을 예측합니다."""

    def __init__(self, model_path, scaler_path):
        """예측기를 초기화합니다. 모델 파일을 로드하고 필요한 상수들을 정의합니다."""
        self.model = XGBClassifier()
        self.model.load_model(model_path)
        self.scaler_path = scaler_path
        self.config = MLConfig
        
        # 온도차 제약조건을 정의합니다
        self.TEMP_DIFF_MIN = 7.6
        self.TEMP_DIFF_MAX = 12.1

    def calculate_power(self, speed, torque):
        """회전 속도와 토크로부터 전력을 계산합니다.
        전력(W) = 2π × 회전속도(rpm) × 토크(Nm) /60"""
        return 2 * np.pi * speed * torque / 60

    def failure_types(self, pred):
        """현재 상태가 어떤 고장 조건에 해당하는지 확인합니다.

        고장 우선순위:
        1. 전력 고장 (PWF)
        2. 과변형 고장 (OSF) - 공구 교체 필요
        3. 열 발산 고장 (HDF) - 냉각 시스템 문제
        """
        if pred == 2:
            return 'HDF'  # 온도차와 rpm에 따라 열 발산 실패
        elif pred == 3:
            return 'PWF'  # 전력값이 임계치를 넘으면 전력 고장
        elif pred == 4:
            return 'OSF'  # 공구 마모가 임계값을 초과하면 과변형 고장
        return 'none'  # 모든 값이 정상 범위 내에 있음

        # 스케일러 위치를 통해 JSON 파일로부터 스케일러 파라미터 로드합니다
    def load_scaler_params(self, scaler_path):
        with open(scaler_path, 'r') as f:
            scaler_params = json.load(f)
        return scaler_params

        # 스케일러 파라미터 값을 받고 스케일러를 반환합니다
    def restore_scaler(self, scaler_params):
        scaler = StandardScaler()
        scaler.mean_ = np.array(scaler_params['mean'])
        scaler.scale_ = np.array(scaler_params['scale'])
        return scaler

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

            # type을 라벨 인코딩합니다
            if input_data['type'] == 'L':
                Type_encoded = 0
            elif input_data['type'] == 'M':
                Type_encoded = 1
            else:
                Type_encoded = 2

            # 분석 데이터셋 생성
            data = {
                'Type_encoded': Type_encoded,
                'Rotational speed': rotational_speed,
                'Tool wear': tool_wear,
                'Temperature difference': temp_diff,
                'Power': power,
                'Wear degree': wear_degree
            }
            df = pd.DataFrame([data])

            # 스케일링할 features 정의합니다
            features = ['Rotational speed', 'Tool wear', 'Temperature difference', 'Power', 'Wear degree']

            # 스케일러 파라미터를 로드합니다
            scaler_params = self.load_scaler_params(self.scaler_path)

            # 스케일러 복원합니다
            scaler = self.restore_scaler(scaler_params)

            # 학습된 스케일링을 분석 데이터셋에 적용시킵니다
            df[features] = scaler.transform(df[features])

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

            # 예측을 시작합니다
            pred = self.model.predict(processed_data)

            # 고장 유형을 확인합니다
            failure_type = self.failure_types(pred)

            # 실제 물리값들을 계산합니다
            temp_diff = float(input_data['Process_Temperature']) - float(input_data['Air_Temperature'])
            power = self.calculate_power(float(input_data['Rotational_Speed']), float(input_data['Torque']))
            tool_wear = float(input_data['Tool_Wear'])

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