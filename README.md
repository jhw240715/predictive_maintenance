# 예측 정비 시스템 (Predictive Maintenance System)

## 프로젝트 소개
이 프로젝트는 머신러닝을 활용하여 밀링머신 고장을 예측하는 시스템입니다. RandomForest 모델을 사용하여 다양한 센서 데이터를 기반으로 고장을 예측합니다.

## 주요 기능
- 실시간 센서 데이터 모니터링
- RandomForest 기반 고장 예측
- 3D 시각화를 통한 고장 부위 표시
- 예측 결과 시각화

## 설치 방법

1. Python 3.8 이상 설치
   - [Python 다운로드](https://www.python.org/downloads/)

2. 프로젝트 클론
```bash
git clone https://github.com/jhw240715/predictive_maintenance.git
cd predictive_maintenance
```

3. 가상환경 생성 및 활성화
```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows의 경우
venv\Scripts\activate
# Linux/Mac의 경우
source venv/bin/activate
```

4. 필요한 패키지 설치
```bash
pip install -r requirements.txt
```

## 사용된 패키지
- numpy (2.2.0): 수치 계산 및 데이터 처리
- pandas (2.2.3): 데이터 분석 및 처리
- scikit-learn (1.4.2): RandomForest 모델 구현
- joblib (1.4.2): 학습된 모델 저장 및 로드
- matplotlib (3.9.3): 데이터 시각화
- seaborn (0.13.2): 고급 데이터 시각화

## 프로젝트 구조
```
predictive_maintenance/
├── maintenance/
│   └── ml/
│       ├── models/          # 학습된 모델 파일
│       │   └── model_rfc_fix.pkl
│       └── data/           # 데이터셋
├── static/
│   └── js/
│       └── simulator3D.js   # 3D 시각화 코드
└── requirements.txt        # 필요한 패키지 목록
```

## 실행 방법
1. 가상환경이 활성화되어 있는지 확인
2. 모델 학습 및 예측 실행
3. 3D 시뮬레이터를 통해 결과 확인

## 주의사항
- 가상환경 사용을 권장합니다
- Python 3.8 이상 버전이 필요합니다
- 모든 패키지는 requirements.txt에 명시된 버전을 사용해주세요