import hashlib
import os
import pathlib
import sys
from time import sleep

import pandas as pd
from phi.embedder.azure_openai import AzureOpenAIEmbedder
import tiktoken


# ref. https://cookbook.openai.com/examples/get_embeddings_from_dataset
embedding_base_url = 'https://models.inference.ai.azure.com'
embedding_model = 'text-embedding-3-large'
embedding_encoding = 'cl100k_base'  # this the encoding for text-embedding-ada-002
azure_api_key = os.getenv('AZURE_OPENAI_API_KEY')
max_tokens = 8000  # the maximum for text-embedding-ada-002 is 8191


def read_docs(directory):
    files = pathlib.Path(directory).rglob('*.md')
    df = pd.DataFrame([], columns=['filename', 'text'])

    for file in files:
        with open(file, 'r') as f:
            text = f.read()
            checksum = hashlib.sha1(text.encode()).hexdigest()
            df_file = pd.DataFrame(
                [[file.relative_to(directory), text, checksum]],
                columns=[ 'filename', 'text', 'checksum'],
            )
            df = pd.concat([df, df_file])
    return df


def update_by_token(df):
    df = df.copy()
    encoding = tiktoken.get_encoding(embedding_encoding)
    df['tokens'] = df['text'].apply(lambda x: encoding.encode(x))
    df['n_tokens'] = df['tokens'].apply(lambda x: len(x))
    df['truncated_text'] = df['tokens'].apply(
        lambda x: encoding.decode(x[:max_tokens]))
    df['truncated_n_tokens'] = df['truncated_text'].apply(
        lambda x: len(encoding.encode(x)))
    return df


def get_embeddings(df):
    df = df.copy()
    embedder = AzureOpenAIEmbedder(
        azure_endpoint=embedding_base_url,
        model=embedding_model,
        api_key=azure_api_key,
    )

    def process(x):
        try:
            embedding = embedder.get_embedding(x)
            sleep(5)  # to avoid rate limiting. based on GitHub Models Free Tier
        except Exception as e:
            print(e)
            embedding = None
        return embedding
    df['embedding'] = df['truncated_text'].apply(process)
    return df


if __name__ == '__main__':
    """
    $ python src/get_embeddings.py ../docs/wiki
    """
    df = read_docs(sys.argv[1])
    df = update_by_token(df)

    # this calls the OpenAI API. May be charged.
    df = get_embeddings(df)
    df.to_csv('output_embeddings.csv')

    print(df)
