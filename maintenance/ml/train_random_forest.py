import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib
from pathlib import Path
from config import MLConfig  # Changed from .config to config

class ModelTrainer:
    def __init__(self):
        self.model = None
        self.config = MLConfig()
        self.current_dir = Path(__file__).resolve().parent
        self.data_path = self.current_dir / 'models' / 'prepared_data.csv'
        self.model_path = self.current_dir / 'models' / 'random_forest_model.joblib'

    def load_and_preprocess_data(self):
        """Load and preprocess the training data"""
        print(f"Loading data from {self.data_path}")
        # Load the data
        df = pd.read_csv(self.data_path)
        
        # Prepare features
        processed_data = []
        for _, row in df.iterrows():
            input_data = {
                'type': row['type'],
                'Air_Temperature': row['Air_Temperature'],
                'Process_Temperature': row['Process_Temperature'],
                'Rotational_Speed': row['Rotational_Speed'],
                'Torque': row['Torque'],
                'Tool_Wear': row['Tool_Wear']
            }
            features = self.config.calculate_derived_features(input_data)
            processed_data.append(list(features.values()))
            
        X = np.array(processed_data)
        y = df['Machine_Failure_Type'].values
        
        return X, y

    def train_model(self, test_size=0.2, random_state=42):
        """Train the Random Forest model"""
        # Load and preprocess data
        X, y = self.load_and_preprocess_data()
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        
        print("Training Random Forest model...")
        # Initialize and train the model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=random_state
        )
        self.model.fit(X_train, y_train)
        
        # Evaluate the model
        y_pred = self.model.predict(X_test)
        print("\nModel Performance:")
        print(classification_report(y_test, y_pred))
        
        return self.model

    def save_model(self):
        """Save the trained model"""
        if self.model is None:
            raise ValueError("Model hasn't been trained yet")
            
        print(f"Saving model to {self.model_path}")
        self.model_path.parent.mkdir(exist_ok=True)
        joblib.dump(self.model, self.model_path)
        print("Model saved successfully!")

def train_and_save_model():
    """Utility function to train and save the model"""
    trainer = ModelTrainer()
    model = trainer.train_model()
    trainer.save_model()

if __name__ == '__main__':
    train_and_save_model()