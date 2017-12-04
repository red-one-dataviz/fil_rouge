import pandas as pd


def create_df(json_str):
    df = pd.read_json(json_str, orient='records')
    return df


def create_df2(dict):
    df = pd.DataFrame(dict)
    return df


def remove_categorical_var(df):
    df_cleaned = df.select_dtypes(['number'])
    return df_cleaned


def remove_categorical_var2(df):
    df = df.apply(pd.to_numeric, errors='coerce')
    df_cleaned = df.dropna(axis=1)
    return df_cleaned


def create_json(df):
    json_str = df.to_json(orient='records')
    return json_str


def create_dict(df):
    dict = df.to_dict(orient='records')
    return dict
