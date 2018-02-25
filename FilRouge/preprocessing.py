import pandas as pd
import numpy as np

df = pd.DataFrame()
variables = {"files": [], "columns": []}

dtypes = {
    "altitude": np.float64,
    "date time": object,
    "flight time": np.float64,
    "fuel flow": np.float64,
    "fuel vol.": np.float64,
    "ground speed": np.float64,
    "idxFile": np.float64,
    "ind. air speed": np.float64,
    "n1 1": np.float64,
    "n2 1": np.float64,
    "nr": np.float64,
    "oat": np.float64,
    "oil pressure 1": np.float64,
    "oil temp. 1": np.float64,
    "phase_no": np.float64,
    "power": np.float64,
    "static pressure": np.float64,
    "take off switch": np.float64,
    "torque 1": np.float64,
    "tot 1": np.float64,
}

def add_selected_files(data, args):
    global df

    d = pd.read_json(data, orient='records', dtype=dtypes)
    if not (df.empty and d.empty):
        # marche pas
        # d.replace('', np.nan, regex=True)
        # d.fillna(method='ffill')
        # print(d["power"])
        cols = d.columns
        cols = cols.map(lambda x: x.replace(' ', '_').replace('.', '') if isinstance(x, (bytes, str)) else x)
        d.columns = cols
        frames = [df, d]
        df = pd.concat(frames).drop_duplicates().reset_index(drop=True)

        variables["files"] = list(df["idxFile"].unique())
        variables["columns"] = list(df.columns.values)
        print(df.dtypes)
    else:
        variables["files"] = []
        variables["columns"] = []

    return variables



def get_pc_data(data, args):
    if args:
        columns = args[0]
        lims = args[1]
    else:
        columns = df.columns.values

    filtered = df.loc[df["idxFile"].isin(data)]
    if lims:
        query_string = ''
        for key, value in lims.items():
            print(key, value)
            # TODO if pas beau
            if not query_string:
                query_string += key +' < ' + str(value[0]) + ' and ' + key +' >= ' + str(value[1])
            else:
                query_string += ' and ' + key +' < ' + str(value[0]) + ' and ' + key +' >= ' + str(value[1])
        # limited = df.loc[(df[list(lims)] == pd.Series(lims)).all(axis=1)]

        # print(query_string)

        limited = df.query(query_string)
        #limited = df.loc[df["phase_no"] == '1']

        print

    else:
        print("no lims")
        limited = filtered

    return {"pcData": create_dict(limited[columns]), "pcColumns": list(columns)}


def get_lc_sp_data(data, args):
    if args:
        feature_x = args[0]
        feature_y = args[1]
    else:
        feature_x = "altitude"
        feature_y = "fuel_flow"
    return {"lcspData": create_dict(df[df["idxFile"] == data][["date_time", feature_x, feature_y]]),
            "lcspColumns": [feature_x, feature_y]}


def get_list_files(data, args):
    return list(df["idxFile"].unique())


def get_columns(data, args):
    return list(df.columns.values)


def delete_file(data, args):
    global df
    df = df.loc[df["idxFile"] != data]

    if not df.empty:
        variables["files"] = list(df["idxFile"].unique())
        variables["columns"] = list(df.columns.values)
    else:
        variables["files"] = []
        variables["columns"] = []

    return variables


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


if __name__ == '__main__':
    print("ok")
