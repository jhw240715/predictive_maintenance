from django.db import models

class SimulatorInput(models.Model):
    """시뮬레이터 입력값을 저장하는 모델"""
    
    # 제품 유형 선택을 위한 상수 정의
    PRODUCT_TYPES = [
        ('L', 'Low'),      # 저사양 제품
        ('M', 'Medium'),   # 중사양 제품
        ('H', 'High')      # 고사양 제품
    ]
    
    # 입력 파라미터 필드들
    type = models.CharField(
        max_length=1,
        choices=PRODUCT_TYPES,
        default='L'
    )  # 제품 유형 (L/M/H)
    
    air_temperature = models.FloatField()      # 공기 온도 (K)
    process_temperature = models.FloatField()  # 공정 온도 (K)
    rotational_speed = models.IntegerField()   # 회전 속도 (rpm)
    torque = models.FloatField()              # 토크 (Nm)
    tool_wear = models.IntegerField()         # 공구 마모도 (min)
    
    created_at = models.DateTimeField(auto_now_add=True, null=True)  # 데이터 생성 시간
    
    def __str__(self):
        return f"입력 #{self.id} - {self.created_at}"

class SimulatorOutput(models.Model):
    """시뮬레이터 출력값(예측 결과)을 저장하는 모델"""
    
    # 고장 유형 선택을 위한 상수 정의
    FAILURE_TYPES = [
        (0, 'No Failure'),  # 정상 상태
        (2, 'HDF'),         # 열 발산 고장
        (3, 'PWF'),         # 전력 고장
        (4, 'OSF')          # 과부하 고장
    ]
    
    # 1:1 관계로 입력값과 연결
    id = models.OneToOneField(
        SimulatorInput,
        on_delete=models.CASCADE,
        primary_key=True
    )
    
    prediction = models.IntegerField(
        choices=FAILURE_TYPES,
        default=0
    )  # 예측된 고장 유형
    
    def __str__(self):
        return f"출력 #{self.id_id} - {self.get_prediction_display()}"