import pandas as pd

# jsonfile
# key : row
# values : col_1, col_2, ... col_p
jsonfile = '{"row 1":{"col 1":"a","col 2":"b", "col3":1, "col4":1.1},' \
           '"row 2":{"col 1":"c","col 2":"d", "col3":2, "col4":2.2}}'


def create_df():
    df = pd.read_json(jsonfile, orient='index')
    return df


def remove_categorical_var(df):
    df_cleaned = df.select_dtypes(['number'])
    return df_cleaned


def get_df(json_str):
    return pd.read_json(json_str, orient='records')


if __name__ == '__main__':
    df = create_df()
    print(df)

    df_cleaned = remove_categorical_var(df)
    print(df_cleaned)
    print(df_cleaned.dtypes)
