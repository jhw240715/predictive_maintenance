import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import os
from pathlib import Path

def prepare_training_data():
    """
    기계 예지 보전을 위한 데이터 전처리 함수
    - 원본 데이터(raw_data.csv)를 읽어서 전처리 후 prepared_data.csv로 저장
    - 전처리 과정: 결측치 처리, 특성 엔지니어링, 레이블 인코딩 등
    """
    # 파일 경로 설정 (OS에 독립적인 경로 처리를 위해 Path 객체 사용)
    current_dir = Path(__file__).resolve().parent.parent  # ml 디렉토리
    raw_data_path = current_dir / 'data' / 'raw' / 'raw_data.csv'  # 원본 데이터 경로
    processed_dir = current_dir / 'data' / 'processed'  # 전처리된 데이터 저장 디렉토리
    output_path = processed_dir / 'prepared_data.csv'  # 전처리된 데이터 저장 경로
    
    # processed 디렉토리가 없으면 생성
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    # 원본 데이터 로드
    print(f"원본 데이터를 {raw_data_path}에서 읽는 중...")
    df = pd.read_csv(raw_data_path)
    
    # 데이터셋 기본 정보 출력
    print("\n원본 데이터 정보:")
    print(df.info())
    
    # 식별자 컬럼 제거 (모델 학습에 불필요)
    print("\n식별자 컬럼 제거 중...")
    df = df.drop(['UDI', 'Product ID'], axis=1)
    
    # 기본 데이터 정제
    print("\n데이터 정제 중...")
    df = df.drop_duplicates()  # 중복 행 제거
    df = df.dropna()  # 결측치가 있는 행 제거
    
    # 컬럼명 표준화 (일관된 네이밍 규칙 적용)
    print("\n컬럼명 표준화 중...")
    df = df.rename(columns={
        'Type': 'type',  # 소문자로 통일
        'Air temperature [K]': 'Air_Temperature',  # 공백 제거 및 snake_case 적용
        'Process temperature [K]': 'Process_Temperature',
        'Rotational speed [rpm]': 'Rotational_Speed',
        'Torque [Nm]': 'Torque',
        'Tool wear [min]': 'Tool_Wear',
        'Machine failure': 'Machine_Failure'
    })
    
    # 범주형 변수(type) 인코딩
    print("\n범주형 변수 인코딩 중...")
    label_encoder = LabelEncoder()
    df['type_encoded'] = label_encoder.fit_transform(df['type'])  # L, M, H를 숫자로 변환
    
    # 파생 특성 생성 (물리적 의미가 있는 새로운 특성)
    print("\n파생 특성 생성 중...")
    df['temp_difference'] = df['Process_Temperature'] - df['Air_Temperature']  # 온도 차이
    df['power'] = df['Rotational_Speed'] * df['Torque']  # 동력
    df['wear_degree'] = df['Tool_Wear'] * df['Torque']  # 마모도
    
    # 수치형 컬럼들의 데이터 타입을 float으로 통일
    print("\n데이터 타입 표준화 중...")
    numeric_columns = [
        'Air_Temperature', 'Process_Temperature', 'Rotational_Speed', 
        'Torque', 'Tool_Wear', 'temp_difference', 'power', 'wear_degree'
    ]
    for col in numeric_columns:
        df[col] = df[col].astype(float)
    
    # 고장 유형 처리
    print("\n고장 유형 처리 중...")
    df['Machine_Failure_Type'] = 'none'  # 기본값: 고장 없음
    
    # 각 고장 유형별로 확인하여 해당하는 고장 유형 할당
    failure_columns = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']  # 고장 유형 컬럼들
    for failure_type in failure_columns:
        mask = df[failure_type] == 1
        df.loc[mask, 'Machine_Failure_Type'] = failure_type
    
    # 전처리된 데이터 저장
    print(f"\n전처리된 데이터를 {output_path}에 저장 중...")
    
    # 필요한 컬럼만 선택하여 저장
    columns_to_save = [
        'type', 'type_encoded',  # 기계 유형 관련
        'Air_Temperature', 'Process_Temperature',  # 온도 관련
        'Rotational_Speed', 'Torque',  # 동작 관련
        'Tool_Wear',  # 마모 관련
        'temp_difference', 'power', 'wear_degree',  # 파생 특성
        'Machine_Failure_Type'  # 목표 변수
    ]
    
    df[columns_to_save].to_csv(output_path, index=False)
    
    # 처리 결과 요약
    print("\n데이터 전처리 완료!")
    print(f"전체 샘플 수: {len(df)}")
    print("\n고장 유형 분포:")
    print(df['Machine_Failure_Type'].value_counts())
    print("\n특성별 통계:")
    print(df[numeric_columns].describe())
    
    return df

if __name__ == "__main__":
    prepared_data = prepare_training_data()