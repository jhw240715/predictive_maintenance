"""
머신러닝 모델 관련 설정을 담고 있는 설정 파일
"""
from pathlib import Path

class MLConfig:
    # 기본 경로 설정
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    
    # 모델 관련 경로
    MODEL_DIR = BASE_DIR / 'maintenance' / 'ml' / 'models'
    MODEL_PATH = MODEL_DIR / 'xgboost_model.joblib'
    
    # 데이터 관련 경로
    DATA_DIR = BASE_DIR / 'maintenance' / 'ml' / 'data'
    RAW_DATA_PATH = DATA_DIR / 'raw' / 'raw_data.csv'
    PROCESSED_DATA_PATH = DATA_DIR / 'processed' / 'prepared_data.csv'

    # Feature configurations
    FEATURE_CONFIG = {
        'features': {
            'type': {
                'options': ['L', 'M', 'H'],
                'default': 'L'
            },
            'Air_Temperature': {
                'min': 295.3,
                'max': 304.5,
                'unit': 'K',
                'default': 295.3
            },
            'Process_Temperature': {
                'min': 305.7,
                'max': 313.8,
                'unit': 'K',
                'default': 305.7
            },
            'Rotational_Speed': {
                'min': 1168,
                'max': 2886,
                'unit': 'rpm',
                'default': 1168
            },
            'Torque': {
                'min': 3.8,
                'max': 76.6,
                'unit': 'Nm',
                'default': 3.8
            },
            'Tool_Wear': {
                'min': 0,
                'max': 200,
                'unit': 'min',
                'default': 0,
                'warning': '공구 마모도는 200분을 초과하면 안됩니다. 200분 이상 사용 시 심각한 품질 문제가 발생할 수 있습니다.'
            }
        }
    }

    # Failure type definitions
    FAILURE_TYPES = {
        'none': {
            'code': 'none',
            'en': 'Normal Operation',
            'kr': '정상 작동',
            'description': '모든 파라미터가 정상 범위 내에서 작동 중입니다.'
        },
        'TWF': {
            'code': 'TWF',
            'en': 'Tool Wear Failure',
            'kr': '공구 마모 고장',
            'description': '공구의 마모가 심각한 수준입니다. 즉시 공구를 교체하고 가공 품질을 확인하세요.'
        },
        'HDF': {
            'code': 'HDF',
            'en': 'Heat Dissipation Failure',
            'kr': '열 발산 고장',
            'description': '장비의 냉각 시스템에 문제가 있습니다. 냉각수 순환과 방열판을 점검하세요.'
        },
        'PWF': {
            'code': 'PWF',
            'en': 'Power Failure',
            'kr': '전력 고장',
            'description': '전력 소비가 비정상적입니다. 전원 공급 장치와 배선 상태를 확인하세요.'
        },
        'OSF': {
            'code': 'OSF',
            'en': 'Overstrain Failure',
            'kr': '과부하 고장',
            'description': '기계에 과도한 부하가 걸려있습니다. 작업 강도를 낮추고 기계 상태를 점검하세요.'
        }
    }

    # Feature engineering configurations
    @staticmethod
    def calculate_derived_features(input_data):
        """Calculate derived features from raw input data"""
        type_encoded_map = {'L': 0, 'M': 1, 'H': 2}
        type_encoded = type_encoded_map.get(input_data.get('type', 'L'), 0)
        
        rotational_speed = float(input_data.get('Rotational_Speed'))
        tool_wear = float(input_data.get('Tool_Wear'))
        torque = float(input_data.get('Torque'))
        process_temp = float(input_data.get('Process_Temperature'))
        air_temp = float(input_data.get('Air_Temperature'))
        
        # Calculate derived features
        temp_difference = process_temp - air_temp
        power = rotational_speed * torque
        wear_degree = tool_wear * torque
        
        return {
            'type_encoded': type_encoded,
            'rotational_speed': rotational_speed,
            'tool_wear': tool_wear,
            'temp_difference': temp_difference,
            'power': power,
            'wear_degree': wear_degree
        }

    # Feature names for the model
    FEATURE_NAMES = [
        'type_encoded',
        'rotational_speed',
        'tool_wear',
        'temp_difference',
        'power',
        'wear_degree'
    ] 