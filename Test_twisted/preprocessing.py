import pandas as pd


# Create DataFrame from JSON file
def create_df(json_str):
    df = pd.read_json(json_str, orient='records')
    return df


def create_df2(dict):
    df = pd.DataFrame(dict)
    return df


# Keep numerical columns only
def remove_categorical_var(df):
    df_cleaned = df.select_dtypes(['number'])
    return df_cleaned


def remove_categorical_var2(df):
    # Suppose first column is necesseraly the datetime column
    datetime = df["date time"]  # Store datetime column somewhere else
    # datetime = df.iloc[:, 0]  # Store datetime column somewhere else
    print(datetime.dtypes)
    df = df.apply(pd.to_numeric, errors='coerce')
    df_cleaned = df.dropna(axis=1)

    frames = [datetime, df_cleaned]

    concatenation = pd.concat(frames, axis=1)
    return concatenation


# To be improved
# Currently : removed every row with at least one empty value
def remove_nan(df):
    df_cleaned = df.dropna(axis=0)
    return df_cleaned


# Create new JSON file from DataFrame
def create_json(df):
    json_str = df.to_json(orient='records')
    return json_str


def create_dict(df):
    dict = df.to_dict(orient='records')
    return dict

# Select columns
def select_columns(df, columns):
    print("COLUMNS :", columns)
    return df[columns]