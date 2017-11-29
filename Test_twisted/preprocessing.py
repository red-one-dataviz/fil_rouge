import pandas as pd


def create_df(json_str):
    df = pd.read_json(json_str, orient='records')
    return df


def remove_categorical_var(df):
    df_cleaned = df.select_dtypes(['number'])
    return df_cleaned


def create_json(df):
    json_str = df.to_json(orient='records')
    return json_str
