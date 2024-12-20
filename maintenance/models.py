from django.db import models

class SimulatorInput(models.Model):
    type = models.CharField(max_length=1, choices=[
        ('L', 'Low'),
        ('M', 'Medium'),
        ('H', 'High')
    ], verbose_name='제품 유형')
    air_temperature = models.FloatField(verbose_name='공기 온도')
    process_temperature = models.FloatField(verbose_name='공정 온도')
    rotational_speed = models.IntegerField(verbose_name='회전 속도')
    torque = models.FloatField(verbose_name='토크')
    tool_wear = models.IntegerField(verbose_name='공구 마모')

    class Meta:
        db_table = 'simulator_input'
        verbose_name = '시뮬레이터 입력값'

class SimulatorOutput(models.Model):
    id = models.OneToOneField(
        SimulatorInput,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='id',
        verbose_name='식별자'
    )
    prediction = models.IntegerField(
        default=0,
        choices=[
            (0, 'No Failure'),
            (1, 'TWF'),
            (2, 'HDF'),
            (3, 'PWF'),
            (4, 'OSF')
        ],
        verbose_name='예측 결과값'
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name='결과 생성 시간'
    )

    class Meta:
        db_table = 'simulator_output'
        verbose_name = '시뮬레이터 출력값'