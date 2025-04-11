import hashlib
import json
import logging
import os
import pathlib
import sqlite3
import sys
from time import sleep

import pandas as pd
import tiktoken
from phi.embedder.azure_openai import AzureOpenAIEmbedder

logging.basicConfig(level=logging.DEBUG)


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
        [[str(file.relative_to(directory)), text, checksum]],
        columns=['filename', 'text', 'checksum'],
      )
      df = pd.concat([df, df_file])
  return df


def update_token(df):
  df = df.copy()
  encoding = tiktoken.get_encoding(embedding_encoding)
  df['tokens'] = df['text'].apply(lambda x: encoding.encode(x))
  df['n_tokens'] = df['tokens'].apply(lambda x: len(x))
  df['truncated_text'] = df['tokens'].apply(
    lambda x: encoding.decode(x[:max_tokens]))
  df['truncated_n_tokens'] = df['truncated_text'].apply(
    lambda x: len(encoding.encode(x)))
  # convert tokens to string to persist
  df['tokens'] = df['tokens'].apply(lambda x: str(x))
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


def save_sqlite(df, filename):
  conn = sqlite3.connect(filename)
  df.to_sql('docs', conn, if_exists='replace', index=False)


def load_embeddings(filename):
  conn = sqlite3.connect(filename)
  df = pd.read_sql('SELECT * FROM docs', conn)
  return df


def persist_embeddings(df, filename):
  df.to_csv(f'{filename}.csv')

  # TODO: Raise an error on objec types
  df['embedding'] = df['embedding'].apply(lambda x: json.dumps(x) if x else None)
  save_sqlite(df, f'{filename}.db')


def get_updated_docs(df, df_docs):
  # merge the two dataframes on the filename
  df_merged = pd.merge(df, df_docs, on='filename', suffixes=('_old', '_new'))

  # check if the checksum is different
  df_updated = df_merged[(df_merged['checksum_old'] != df_merged['checksum_new']) | df_merged['embedding'].isnull()]

  # get the updated documents
  updated_docs = df_updated[['filename', 'text_new', 'checksum_new']]
  updated_docs.columns = ['filename', 'text', 'checksum']
  return updated_docs.reset_index(drop=True)


def merge_docs(df, df_updated_docs):
  result_df = df.copy()

  result_df_indexed = result_df.set_index('filename')
  df_updates_indexed = df_updated_docs.set_index('filename')

  columns_to_update = ['text', 'checksum', 'embedding']
  result_df_indexed.update(df_updates_indexed[columns_to_update])

  return result_df_indexed.reset_index()


if __name__ == '__main__':
  """
  $ python src/get_embeddings.py ../docs/wiki
  """
  db_file = sys.argv[2] if len(sys.argv) > 2 else 'output_embeddings.db'
  df = load_embeddings(db_file)
  df_docs = read_docs(sys.argv[1])

  df_updated_docs = get_updated_docs(df, df_docs)
  df_updated_docs = update_token(df_updated_docs)

  logging.info(f'Updated docs: {df_updated_docs.shape[0]}')
  df_updated_docs = get_embeddings(df_updated_docs)

  df = merge_docs(df, df_updated_docs)
  persist_embeddings(df, 'output_embeddings')

  logging.info(df)
  logging.info(df.dtypes)
