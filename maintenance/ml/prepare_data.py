import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import os
from pathlib import Path

def prepare_training_data():
    """
    Prepare raw data for training the random forest model.
    Uses data from ml/data/raw_data.csv and saves to ml/models/
    """
    # Setup paths
    current_dir = Path(__file__).resolve().parent
    raw_data_path = current_dir / 'data' / 'raw_data.csv'
    models_dir = current_dir / 'models'
    output_path = models_dir / 'prepared_data.csv'
    
    # Create models directory if it doesn't exist
    models_dir.mkdir(exist_ok=True)
    
    # Read the raw data
    print(f"Reading raw data from {raw_data_path}...")
    df = pd.read_csv(raw_data_path)
    
    # Display initial information about the dataset
    print("\nInitial data info:")
    print(df.info())
    
    # Drop identifier columns
    print("\nDropping identifier columns...")
    df = df.drop(['UDI', 'Product ID'], axis=1)
    
    # Basic cleaning
    print("\nCleaning data...")
    # Remove any duplicate rows
    df = df.drop_duplicates()
    
    # Handle missing values if any
    df = df.dropna()
    
    # Rename columns to match our expected format
    df = df.rename(columns={
        'Type': 'type',
        'Air temperature [K]': 'Air_Temperature',
        'Process temperature [K]': 'Process_Temperature',
        'Rotational speed [rpm]': 'Rotational_Speed',
        'Torque [Nm]': 'Torque',
        'Tool wear [min]': 'Tool_Wear',
        'Machine failure': 'Machine_Failure'
    })
    
    # Encode the 'type' column (L, M, H)
    label_encoder = LabelEncoder()
    df['type_encoded'] = label_encoder.fit_transform(df['type'])
    
    # Create derived features
    print("\nCreating derived features...")
    df['temp_difference'] = df['Process_Temperature'] - df['Air_Temperature']
    df['power'] = df['Rotational_Speed'] * df['Torque']
    df['wear_degree'] = df['Tool_Wear'] * df['Torque']
    
    # Ensure all numeric columns are float type
    numeric_columns = ['Air_Temperature', 'Process_Temperature', 'Rotational_Speed', 
                      'Torque', 'Tool_Wear', 'temp_difference', 'power', 'wear_degree']
    for col in numeric_columns:
        df[col] = df[col].astype(float)
    
    # Process failure types
    print("\nProcessing failure types...")
    # Default is 'none' (no failure)
    df['Machine_Failure_Type'] = 'none'
    
    # Set failure type based on the failure columns
    failure_columns = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']
    for failure_type in failure_columns:
        mask = df[failure_type] == 1
        df.loc[mask, 'Machine_Failure_Type'] = failure_type
    
    # Save processed data
    print(f"\nSaving processed data to {output_path}...")
    
    # Save only necessary columns
    columns_to_save = [
        'type', 'type_encoded', 'Air_Temperature', 'Process_Temperature',
        'Rotational_Speed', 'Torque', 'Tool_Wear', 'temp_difference',
        'power', 'wear_degree', 'Machine_Failure_Type'
    ]
    
    df[columns_to_save].to_csv(output_path, index=False)
    
    # Print summary statistics
    print("\nData preparation completed!")
    print(f"Total samples: {len(df)}")
    print("\nFailure type distribution:")
    print(df['Machine_Failure_Type'].value_counts())
    print("\nFeature statistics:")
    print(df[numeric_columns].describe())
    
    return df

if __name__ == "__main__":
    prepared_data = prepare_training_data()