import sys
import pandas as pd
import numpy as np


def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


if __name__ == '__main__':
    """
    $ python cosine_similarity.py data.csv
    """
    df = pd.read_csv(sys.argv[1])
    df = df[['filename', 'embedding']]
    df['embedding'] = df['embedding'].apply(lambda x: eval(x))
    df = df.merge(df, how='cross')
    df['similarity'] = df.apply(lambda x: cosine_similarity(x['embedding_x'], x['embedding_y']), axis=1)
    print(df[['filename_x', 'filename_y', 'similarity']])
