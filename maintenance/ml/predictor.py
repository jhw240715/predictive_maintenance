import numpy as np
import joblib
from .config import MLConfig

class MillingMachinePredictor:
    def __init__(self, model_path):
        """Initialize the predictor with a trained model"""
        self.model = joblib.load(model_path)
        self.config = MLConfig()

    def validate_input(self, input_data):
        """Validate input data against configuration"""
        for feature, config in self.config.FEATURE_CONFIG['features'].items():
            if feature not in input_data:
                raise ValueError(f"Missing required feature: {feature}")
            
            value = input_data[feature]
            if feature == 'type':
                if value not in config['options']:
                    raise ValueError(f"Invalid type value. Must be one of {config['options']}")
            else:
                try:
                    value = float(value)
                    if value < config['min'] or value > config['max']:
                        raise ValueError(
                            f"Value for {feature} must be between "
                            f"{config['min']} and {config['max']} {config['unit']}"
                        )
                except ValueError:
                    raise ValueError(f"Invalid value for {feature}")

    def predict(self, input_data):
        """Make a prediction based on input data"""
        # Validate input
        self.validate_input(input_data)
        
        # Calculate derived features
        derived_features = self.config.calculate_derived_features(input_data)
        
        # Create feature vector
        features = np.array([
            derived_features[feature_name] 
            for feature_name in self.config.FEATURE_NAMES
        ]).reshape(1, -1)
        
        # Make prediction
        prediction = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]
        
        # Get failure type information
        failure_info = self.config.FAILURE_TYPES.get(
            prediction,
            self.config.FAILURE_TYPES['none']
        )
        
        # Prepare response
        response = {
            'prediction': prediction,
            'failure_info': failure_info,
            'probabilities': {
                failure_type: float(prob)
                for failure_type, prob in zip(self.model.classes_, probabilities)
            },
            'input_parameters': input_data,
            'derived_features': derived_features
        }
        
        return response

    def get_component_status(self, prediction_result):
        """Get the status of different machine components based on prediction"""
        failure_code = prediction_result['prediction']
        component_status = {
            'tool': 'normal',
            'cooling_system': 'normal',
            'power_system': 'normal',
            'mechanical_system': 'normal'
        }
        
        if failure_code == 'TWF':
            component_status['tool'] = 'error'
        elif failure_code == 'HDF':
            component_status['cooling_system'] = 'error'
        elif failure_code == 'PWF':
            component_status['power_system'] = 'error'
        elif failure_code == 'OSF':
            component_status['mechanical_system'] = 'error'
        elif failure_code == 'RNF':
            # For random failures, mark all systems as warning
            component_status = {k: 'warning' for k in component_status}
            
        return component_status