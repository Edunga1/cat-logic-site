import sys
import pandas as pd
import numpy as np


def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def save_df_to_json(df, filename):
    df.to_json(filename, orient='records')


if __name__ == '__main__':
    """
    $ python src/cosine_similarity.py data.csv
    """
    df = pd.read_csv(sys.argv[1])
    df = df[['filename', 'embedding']]
    df['embedding'] = df['embedding'].apply(lambda x: eval(x))
    df = df.merge(df, how='cross')
    df['similarity'] = df.apply(lambda x: cosine_similarity(x['embedding_x'], x['embedding_y']), axis=1)
    df_result = df[['filename_x', 'filename_y', 'similarity']]
    print(df_result)
    save_df_to_json(df_result, 'similarity-result.json')
    print('Saved to similarity-result.json')
