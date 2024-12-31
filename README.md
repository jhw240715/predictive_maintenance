# 밀링 머신 예측 유지보수 시스템

## 프로젝트 소개
이 프로젝트는 밀링 머신의 센서 데이터를 기반으로 장비의 고장을 예측하는 예측 유지보수 시스템입니다. 다양한 머신러닝 모델을 활용하여 고장 예측의 정확도를 비교 분석할 수 있습니다.

## 주요 기능
- 6가지 머신러닝 모델을 통한 고장 예측
  - 로지스틱 회귀 (정확도: 87.50%)
  - KNN (정확도: 93.78%)
  - SVM (정확도: 96.46%)
  - 의사결정트리 (정확도: 97.56%)
  - 랜덤 포레스트 (정확도: 97.59%)
  - XGBoost (정확도: 97.46%)

- 실시간 예측 시뮬레이터

- 모델별 성능 비교 분석
  - Confusion Matrix
  - ROC Curve
  - 정확도, 정밀도, 재현율, F1 Score

## 기술 스택
- Backend: Django
- Frontend: HTML, CSS, JavaScript
- Machine Learning: scikit-learn, XGBoost
- Visualization: Plotly

## 설치 방법
1. 저장소 클론
```bash
git clone [repository URL]
cd predictive_maintenance
```

2. 가상환경 생성 및 활성화
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. 필요한 패키지 설치
```bash
pip install -r requirements.txt
```

4. 서버 실행
```bash
python manage.py runserver
```

## 사용 방법
1. 웹 브라우저에서 http://localhost:8000 접속
2. 각 모델별 성능 비교 페이지 확인
3. 시뮬레이터에서 실시간 예측 테스트

## 프로젝트 구조
```
predictive_maintenance/
├── maintenance/
│   ├── ml/
│   │   ├── models/
│   │   ├── reports/
│   │   └── data/
│   ├── static/
│   └── templates/
├── static/
│   ├── css/
│   ├── js/
│   └── images/
└── templates/
```