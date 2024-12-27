# 밀링 머신 예측 유지보수 시스템

밀링 머신의 고장을 예측하고 시뮬레이션할 수 있는 웹 기반 시스템입니다.

## 설치 방법

1. 프로젝트 클론
```bash
git clone https://github.com/jhw240715/predictive_maintenance.git
cd predictive_maintenance
```

2. 가상환경 생성 및 활성화
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. 필요한 패키지 설치
```bash
pip install -r requirements.txt
```

4. 데이터베이스 마이그레이션
```bash
python manage.py makemigrations
python manage.py migrate
```

5. 정적 파일 수집
```bash
python manage.py collectstatic
```

## 실행 방법

1. 개발 서버 실행
```bash
python manage.py runserver
```

2. 웹 브라우저에서 접속
- http://127.0.0.1:8000 으로 접속

## 주요 기능
- 밀링 머신 예측 유지보수
- 다양한 머신러닝 모델 성능 비교 (로지스틱 회귀, KNN, SVM, 의사결정트리, 랜덤포레스트, XGBoost)
- 실시간 고장 예측 시뮬레이터
- 3D 밀링머신 시각화

## 기술 스택
- Django 4.2.7
- Python 3.9+
- JavaScript
- Three.js
- HTML/CSS
- Bootstrap 5.3.2

## 프로젝트 구조
- config/: Django 프로젝트 설정
- maintenance/: 메인 애플리케이션
- static/: 정적 파일 (CSS, JS, 이미지)
- templates/: HTML 템플릿
- requirements.txt: 프로젝트 의존성