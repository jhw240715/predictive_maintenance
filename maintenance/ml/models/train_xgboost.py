import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import xgboost as xgb
import joblib
from pathlib import Path
from config import MLConfig

class ModelTrainer:
    """
    XGBoost 모델 학습을 위한 클래스
    - 데이터 전처리
    - 모델 학습
    - 성능 평가
    - 모델 저장
    기능을 포함
    """
    
    def __init__(self):
        """
        클래스 초기화
        - 모델 객체 초기화
        - 설정 로드
        - 파일 경로 설정
        """
        self.model = None  # XGBoost 모델 객체
        self.config = MLConfig()  # 설정 파일 로드
        self.current_dir = Path(__file__).resolve().parent.parent  # 현재 스크립트의 부모 디렉토리 (ml 폴더)
        self.data_path = self.current_dir / 'data' / 'processed' / 'prepared_data.csv'  # 전처리된 데이터 경로
        self.model_path = self.current_dir / 'models' / 'xgboost_model.joblib'  # 모델 저장 경로

    def load_and_preprocess_data(self):
        """
        데이터 로드 및 전처리 함수
        
        Returns:
            X (np.array): 입력 특성 배열
            y (np.array): 목표 변수 배열 (고장 유형)
            
        처리 과정:
        1. CSV 파일에서 데이터 로드
        2. RNF(Random Failure) 데이터 제외
        3. 특성 계산
        4. 고장 유형을 숫자로 변환
        """
        print(f"Loading data from {self.data_path}")
        # 데이터 로드
        df = pd.read_csv(self.data_path)
        
        # RNF(Random Failure) 데이터 제외 - 예측이 불필요한 유형
        df = df[df['Machine_Failure_Type'] != 'RNF']
        
        # 특성 준비 - 각 행에 대해 파생 특성 계산
        processed_data = []
        for _, row in df.iterrows():
            # 입력 데이터 딕셔너리 생성
            input_data = {
                'type': row['type'],  # 기계 유형
                'Air_Temperature': row['Air_Temperature'],  # 공기 온도
                'Process_Temperature': row['Process_Temperature'],  # 공정 온도
                'Rotational_Speed': row['Rotational_Speed'],  # 회전 속도
                'Torque': row['Torque'],  # 토크
                'Tool_Wear': row['Tool_Wear']  # 공구 마모
            }
            # MLConfig에 정의된 방식으로 파생 특성 계산
            features = self.config.calculate_derived_features(input_data)
            processed_data.append(list(features.values()))
            
        X = np.array(processed_data)  # 특성 배열로 변환
        
        # 고장 유형을 숫자로 변환 (XGBoost는 문자열 레이블을 처리할 수 없음)
        failure_type_mapping = {
            'none': 0,  # 정상 상태
            'TWF': 1,   # Tool Wear Failure (공구 마모 고장)
            'HDF': 2,   # Heat Dissipation Failure (열 발산 고장)
            'PWF': 3,   # Power Failure (전력 고장)
            'OSF': 4    # Overstrain Failure (과부하 고장)
        }
        y = df['Machine_Failure_Type'].map(failure_type_mapping).values
        
        return X, y

    def train_model(self, test_size=0.3, random_state=42):
        """
        XGBoost 모델 학습 함수
        
        Args:
            test_size (float): 테스트 데이터 비율 (기본값: 0.3)
            random_state (int): 랜덤 시드 (기본값: 42)
            
        Returns:
            XGBClassifier: 학습된 XGBoost 모델
            
        처리 과정:
        1. 데이터 로드 및 전처리
        2. 학습/테스트 데이터 분할 (7:3 비율)
        3. XGBoost 모델 학습
        4. 성능 평가
        """
        # 데이터 로드 및 전처리
        X, y = self.load_and_preprocess_data()
        
        # 학습/테스트 데이터 분할 (7:3 비율)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        
        print("Training XGBoost model...")
        # XGBoost 모델 초기화 및 학습
        self.model = xgb.XGBClassifier(
            objective='multi:softmax',  # 다중 분류 문제
            num_class=5,  # 고장 유형 수 (정상 + 4가지 고장)
            learning_rate=0.1,  # 학습률 (너무 크면 과적합, 너무 작으면 학습 속도 저하)
            gamma=0.1,  # 최소 손실 감소값 (과적합 방지)
            subsample=0.8,  # 각 트리마다 사용할 데이터 샘플링 비율
            colsample_bytree=0.8,  # 각 트리마다 사용할 특성 샘플링 비율
            random_state=random_state  # 재현성을 위한 랜덤 시드
        )
        self.model.fit(X_train, y_train)
        
        # 고장 유형 매핑 (숫자 → 문자열, 성능 평가 출력용)
        failure_types = ['none', 'TWF', 'HDF', 'PWF', 'OSF']
        
        # 모델 성능 평가
        y_pred = self.model.predict(X_test)
        print("\nModel Performance:")
        print(classification_report(
            [failure_types[int(i)] for i in y_test],  # 실제 레이블
            [failure_types[int(i)] for i in y_pred]   # 예측 레이블
        ))
        
        return self.model

    def save_model(self):
        """
        학습된 모델을 파일로 저장하는 함수
        - joblib 형식으로 저장
        - 저장 전에 모델 학습 여부 확인
        """
        if self.model is None:
            raise ValueError("Model hasn't been trained yet")
            
        print(f"Saving model to {self.model_path}")
        self.model_path.parent.mkdir(exist_ok=True)  # 저장 디렉토리 생성
        joblib.dump(self.model, self.model_path)  # 모델을 joblib 형식으로 저장
        print("Model saved successfully!")

def train_and_save_model():
    """
    모델 학습 및 저장을 실행하는 유틸리티 함수
    1. ModelTrainer 인스턴스 생성
    2. 모델 학습 실행
    3. 학습된 모델 저장
    """
    trainer = ModelTrainer()
    model = trainer.train_model()
    trainer.save_model()

if __name__ == '__main__':
    # 스크립트가 직접 실행될 때 모델 학습 및 저장 수행
    train_and_save_model() 