# 밀링 머신 예측 유지보수 시스템

밀링 머신의 고장을 예측하고 시뮬레이션할 수 있는 웹 기반 시스템입니다.

## 설치 방법

1. 프로젝트 클론
```bash
git clone [repository URL]
cd predictive_maintenance
```

2. 가상환경 생성 및 활성화
```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows의 경우:
venv\Scripts\activate
# macOS/Linux의 경우:
source venv/bin/activate
```

3. 필요한 패키지 설치
```bash
pip install -r requirements.txt
```

4. 환경 변수 설정
- 프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가:
```
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
```

5. 데이터베이스 마이그레이션
```bash
python manage.py migrate
```

6. 개발 서버 실행
```bash
python manage.py runserver
```

## 주요 기능

- 머신러닝 모델 성능 비교 분석
- 실시간 고장 예측 시뮬레이터
- 3D 밀링 머신 시각화
- ROC 커브 및 혼동 행렬 분석

## 기술 스택

- Backend: Django 4.2.7
- Frontend: HTML, CSS, JavaScript
- Data Processing: NumPy, Pandas
- Machine Learning: Scikit-learn
- Visualization: Plotly, Three.js

## 프로젝트 구조
```
predictive_maintenance/
├── maintenance/         # 메인 앱 디렉토리
├── static/             # 정적 파일 (CSS, JS, 이미지)
├── templates/          # HTML 템플릿
├── manage.py           # Django 관리 스크립트
├── requirements.txt    # 프로젝트 의존성
└── .env               # 환경 변수 (생성 필요)
```

