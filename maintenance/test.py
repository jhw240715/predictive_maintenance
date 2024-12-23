import pandas as pd

# pkl 파일 읽기
data = pd.read_pickle(r"C:\Users\dd\Downloads\xgboost_model.pkl")


# 데이터 확인
print(data)