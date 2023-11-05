import glob

import pandas as pd
import tiktoken
from openai.embeddings_utils import get_embedding

# ref. https://cookbook.openai.com/examples/get_embeddings_from_dataset
embedding_model = 'text-embedding-ada-002'
embedding_encoding = 'cl100k_base'  # this the encoding for text-embedding-ada-002
max_tokens = 8000  # the maximum for text-embedding-ada-002 is 8191


def read_docs(path):
    """
    max_length는 max_tokens에 맞춰서 대강 설정함. 정확하지 않음.
    """
    files = glob.glob(path)
    df = pd.DataFrame([], columns=['filename', 'text'])

    for file in files:
        with open(file, 'r') as f:
            text = f.read()
            df_file = pd.DataFrame([[file, text]], columns=[
                                   'filename', 'text'])
            df = pd.concat([df, df_file])
    return df


def update_by_token(df):
    encoding = tiktoken.get_encoding(embedding_encoding)
    df['tokens'] = df['text'].apply(lambda x: encoding.encode(x))
    df['n_tokens'] = df['tokens'].apply(lambda x: len(x))
    df['truncated_text'] = df['tokens'].apply(
        lambda x: encoding.decode(x[:max_tokens]))
    df['truncated_n_tokens'] = df['truncated_text'].apply(
        lambda x: len(encoding.encode(x)))


def get_embeddings(df):
    def process(x):
        try:
            embedding = get_embedding(x, engine=embedding_model)
        except Exception as e:
            print(e)
            embedding = None
        return embedding
    df['embedding'] = df['truncated_text'].apply(process)
    return df


if __name__ == '__main__':
    df = read_docs('../docs/wiki/*.md')
    update_by_token(df)
    embeddings = get_embeddings(df)
    embeddings.to_csv('output_embeddings.csv')
    print(embeddings)
