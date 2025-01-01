class MLConfig:
    # Feature configurations
    FEATURE_CONFIG = {
        'features': {
            'type': {
                'options': ['L', 'M', 'H'],
                'default': 'L'
            },
            'air_temperature': {
                'min': 295.3,
                'max': 304.5,
                'unit': 'K',
                'default': 295.3
            },
            'process_temperature': {
                'min': 305.7,
                'max': 313.8,
                'unit': 'K',
                'default': 305.7
            },
            'rotational_speed': {
                'min': 1168,
                'max': 2886,
                'unit': 'rpm',
                'default': 1168
            },
            'torque': {
                'min': 3.8,
                'max': 76.6,
                'unit': 'Nm',
                'default': 3.8
            },
            'tool_wear': {
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
        
        rotational_speed = float(input_data.get('rotational_speed'))
        tool_wear = float(input_data.get('tool_wear'))
        torque = float(input_data.get('torque'))
        process_temp = float(input_data.get('process_temperature'))
        air_temp = float(input_data.get('air_temperature'))
        
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
