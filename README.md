# 밀링 머신 예측 유지보수 시스템

## 프로젝트 소개
이 프로젝트는 밀링 머신의 작동 파라미터를 모니터링하고 잠재적인 고장을 예측하는 시스템입니다. 
작업자들이 실시간으로 기계의 상태를 확인하고 예방 조치를 취할 수 있도록 도와줍니다.

## 환경 변수 설정

프로젝트는 두 가지 방식의 환경 변수 로드를 지원합니다:

1. django-environ 사용:
```python
import environ
env = environ.Env()
environ.Env.read_env(
    env_file=os.path.join(BASE_DIR, '.env')
)
```

2. python-dotenv 사용:
```python
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, '.env'))
```

두 패키지 모두 requirements.txt에 포함되어 있으므로, 원하는 방식을 선택하여 사용하시면 됩니다.

## 설치 방법

1. 프로젝트 클론
```bash
git clone [프로젝트 URL]
cd predictive_maintenance
```

2. 가상환경 생성 및 활성화
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
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

5. 서버 실행
```bash
python manage.py runserver
```

## 주요 기능
- 실시간 밀링 머신 파라미터 모니터링
- 머신러닝 기반 고장 예측
- 3D 시각화를 통한 직관적인 상태 확인
- 다양한 고장 유형 감지 (열 발산 고장, 전력 고장, 과부하 고장)

## 시스템 요구사항
- Python 3.8 이상
- Django 5.1.4
- 기타 필요한 패키지는 requirements.txt 참조

## 사용된 기술
- Backend: Django
- Machine Learning: scikit-learn, XGBoost
- Data Processing: NumPy, Pandas
- Visualization: Matplotlib, Seaborn

## 주의사항
- 공구 마모도는 200분을 초과하지 않도록 주의
- 온도 차이는 7.6K에서 12.1K 사이로 유지
- 전력 소비량이 20kW를 초과하지 않도록 관리