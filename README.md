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

## 발표자료
![Image](https://github.com/user-attachments/assets/67aca0f7-bf01-4773-9544-b700c9ae6b6f)
![Image](https://github.com/user-attachments/assets/6d2f89c8-e36c-4785-8210-3efc745c6c58)
![Image](https://github.com/user-attachments/assets/855654bd-8622-413c-bc88-3c8ecfba836f)
![Image](https://github.com/user-attachments/assets/b6eb9748-4db0-4882-9a45-a4e37410bb70)
![Image](https://github.com/user-attachments/assets/583b25f9-d0db-48a6-aa9f-3b26abd4426a)
![Image](https://github.com/user-attachments/assets/39a5036b-d23d-49a2-81f4-c4e162d76e58)
![Image](https://github.com/user-attachments/assets/5f435e7c-94a0-40ac-a095-cf1f2318b8fe)
![Image](https://github.com/user-attachments/assets/dda6e570-48e1-402e-a5c8-bc0293b5e1e2)
![Image](https://github.com/user-attachments/assets/7d54ab1a-b70b-4222-a3c5-6a59592b3452)
![Image](https://github.com/user-attachments/assets/7f10db74-23c4-4292-a2b5-54f11a7e0c7c)
![Image](https://github.com/user-attachments/assets/7a4c1945-ff42-4dd9-ac1a-66a5ee300873)
![Image](https://github.com/user-attachments/assets/d73a8a9b-24b3-4884-8051-93c61585d9fd)
![Image](https://github.com/user-attachments/assets/c4486382-be35-432a-aa1b-430eca7756fe)
![Image](https://github.com/user-attachments/assets/dc14d4bb-d134-47fd-8dc9-99278ea19f0e)
![Image](https://github.com/user-attachments/assets/8d60c5f6-9e1a-428b-a806-db3fdbf4d43a)
![Image](https://github.com/user-attachments/assets/83828964-c08a-4706-9303-f7380392f8f3)
![Image](https://github.com/user-attachments/assets/21070a9d-eaa9-4a64-ac6c-8f5cff6efd29)
![Image](https://github.com/user-attachments/assets/51ffd17a-ca34-4072-8761-c05fdfa41328)
![Image](https://github.com/user-attachments/assets/8d0ebcdf-9457-46fa-bb45-7ca5c8dabffe)
![Image](https://github.com/user-attachments/assets/737c1b93-47e4-4794-9fa7-38f665349a4b)
![Image](https://github.com/user-attachments/assets/0eaec21f-ebc1-4ada-bddc-a9b02c9eb9ee)
![Image](https://github.com/user-attachments/assets/e232c0e8-36be-486a-9db0-80fc22ca67e1)
![Image](https://github.com/user-attachments/assets/cd162570-aa23-476a-8b0e-a7abb734a2ef)
![Image](https://github.com/user-attachments/assets/e935fa86-d97d-449b-966a-6d0dbf4e3756)
![Image](https://github.com/user-attachments/assets/abdc3ce8-d2ad-456a-965c-82c4e3423319)
![Image](https://github.com/user-attachments/assets/0dd419ed-f4f4-4d4e-a8ce-1e844649bcf0)
![Image](https://github.com/user-attachments/assets/687b8558-55ae-4157-8094-8728385ed628)
![Image](https://github.com/user-attachments/assets/d7c1d2e9-308f-4436-832e-d5a42549d39d)
![Image](https://github.com/user-attachments/assets/0d33c682-20ca-401b-ac82-f623ed67cbd5)
![Image](https://github.com/user-attachments/assets/018732c9-cf34-46dd-9263-28a766dfbcb8)
![Image](https://github.com/user-attachments/assets/3019a9dc-c58d-44b2-9023-bcefefb40f6c)
![Image](https://github.com/user-attachments/assets/307ffbf9-4b6b-4ad2-8f23-42797398d517)
![Image](https://github.com/user-attachments/assets/d5b8fb8a-3337-44f7-bf5a-2c727fe7ba90)
![Image](https://github.com/user-attachments/assets/c262413a-b1a7-421e-b673-5345ad9dee5f)
![Image](https://github.com/user-attachments/assets/5c10f968-096e-4ea9-82bb-b14c2ca0882d)
![Image](https://github.com/user-attachments/assets/942108c1-00d8-4b79-bfcd-90c4afc1f124)
![Image](https://github.com/user-attachments/assets/9428496c-8990-41d5-a5ad-25a7e7981970)
![Image](https://github.com/user-attachments/assets/60f0b27d-8c49-45c2-88e2-c724bcc7297d)
![Image](https://github.com/user-attachments/assets/395e07d8-be0c-4402-adf5-07e7eff62461)
![Image](https://github.com/user-attachments/assets/b6daafb4-a187-4c6f-98d2-a76a83a096d9)
![Image](https://github.com/user-attachments/assets/8bbe24a8-c9e9-426a-af72-1a8f85596216)
![Image](https://github.com/user-attachments/assets/6a605f6b-bc70-435d-afd0-dcb38f44b24f)
![Image](https://github.com/user-attachments/assets/2a1d6d39-1e93-4a4b-9030-dcd3c69297af)
![Image](https://github.com/user-attachments/assets/1b853e2d-0ab3-4bc1-9e16-9bd250c118cd)
![Image](https://github.com/user-attachments/assets/87cec791-4595-4fde-a5ed-a2aca7c9c906)
![Image](https://github.com/user-attachments/assets/c5c0cf57-ca37-424b-aff6-5c4edb1466be)
![Image](https://github.com/user-attachments/assets/767ca1c5-d483-47a3-8255-e427a7f2f74e)
![Image](https://github.com/user-attachments/assets/16c27606-385b-4c9c-9bbd-c8fe17632bac)
![Image](https://github.com/user-attachments/assets/24e34dcf-375d-4bc0-b8a0-2bd438c8a4be)
