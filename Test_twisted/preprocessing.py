import pandas as pd


def create_df(json_str):
    """
    Create DataFrame from JSON file
    :param json_str: a JSON string
    :return: a pandas DataFrame
    """
    df = pd.read_json(json_str, orient='records')
    return df


def create_df2(dict):
    """
    Create DataFrame from a dictionary
    :param dict: a dictionary
    :return: a pandas DataFrame
    """
    df = pd.DataFrame(dict)
    return df


def remove_categorical_var(df):
    """
    Keep numerical columns only
    :param df: a pandas DataFrame
    :return: a pandas DataFrame that contains only numerical columns
    """
    df_cleaned = df.select_dtypes(['number'])
    return df_cleaned


def remove_categorical_var2(df):
    """
    Keep numerical columns only
    :param df: a pandas DataFrame
    :return: a pandas DataFrame that contains only numerical columns
    """
    # Suppose first column is necesseraly the datetime column
    datetime = df["date time"]  # Store datetime column somewhere else
    # datetime = df.iloc[:, 0]  # Store datetime column somewhere else
    print(datetime.dtypes)
    df = df.apply(pd.to_numeric, errors='coerce')
    df_cleaned = df.dropna(axis=1)

    frames = [datetime, df_cleaned]

    concatenation = pd.concat(frames, axis=1)
    return concatenation


def remove_nan(df):
    """
    To be improved
    Currently : remove every row with at least one empty value

    :param df: a pandas DataFrame
    :return: a pandas DataFrame
    """
    df_cleaned = df.dropna(axis=0)
    return df_cleaned


def create_json(df):
    """
    Create new JSON file from DataFrame
    :param df: a pandas DataFrame
    :return: a new JSON file
    """
    json_str = df.to_json(orient='records')
    return json_str


def create_dict(df):
    """
    Create new dictionary from DataFrame
    :param df: a pandas DataFrame
    :return: a new dictionary
    """
    dict = df.to_dict(orient='records')
    return dict


def select_columns(df, columns):
    """
    Return a new DataFrame with selected columns
    :param df: a pandas DataFrame
    :param columns: a list of columns we want to see
    :return: a pandas DataFrame with the selected columns only
    """
    print("COLUMNS :", columns)
    return df[columns]


def initialize_datetime(df):
    """
    :param df: an input DataFrame
    :return: new DataFrame with datetime intialized with first value
    """

    print("Re-initiate date time")
    df_new = df.copy()
    # df_init = df[["indexFile", "date time"]].copy()
    #
    # df_init["date time"] = pd.to_datetime(df_new[["date time"]], format="%Y-%m-%d %H:%M:%S")
    # df_init = df_init.groupby("indexFile").min()
    # print(df_init)

    df_new["date time"] = pd.to_datetime(df_new["date time"], format="%Y-%m-%d %H:%M:%S") - \
                          pd.to_datetime(df_new.loc[0, "date time"], format="%Y-%m-%d %H:%M:%S")

    df_new["date time"] = df_new["date time"].apply(lambda x: str(x).split(' ')[2])

    return df_new

# if __name__ == '__main__':
#     df = pd.read_csv('/Users/thaianthantrong/Desktop/data_with_phase/FL_18000101-112901.csv')
#     initialize_datetime(df)
