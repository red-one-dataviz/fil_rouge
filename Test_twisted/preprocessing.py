import pandas as pd


# Create DataFrame from JSON file
def create_df(json_str):
    df = pd.read_json(json_str, orient='records')
    return df


# Keep numerical columns only
def remove_categorical_var(df):
    df_cleaned = df.select_dtypes(['number'])
    return df_cleaned


# To be improved
# Currently : removed every row with at least one empty value
def remove_nan(df):
    df_cleaned = df.dropna(axis=0)
    return df_cleaned


# Create new JSON file from DataFrame
def create_json(df):
    json_str = df.to_json(orient='records')
    return json_str
