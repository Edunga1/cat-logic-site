import hashlib
import json
import logging
import os
import ast
import pathlib
import sqlite3
import sys
from time import sleep

import pandas as pd
import tiktoken
from phi.embedder.azure_openai import AzureOpenAIEmbedder


logging.basicConfig(level=logging.INFO)

# ref. https://cookbook.openai.com/examples/get_embeddings_from_dataset
embedding_base_url = 'https://models.inference.ai.azure.com'
embedding_model = 'text-embedding-3-large'
embedding_encoding = 'cl100k_base'  # this the encoding for text-embedding-ada-002
max_tokens = 8000  # the maximum for text-embedding-ada-002 is 8191


def get_azure_api_key():
  return os.environ['AZURE_OPENAI_API_KEY']


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
    api_key=get_azure_api_key(),
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
  df['embedding'] = df['embedding'].apply(ast.literal_eval)
  return df


def persist_embeddings(df, filename):
  df.to_csv(f'{filename}.csv')

  # TODO: Raise an error on object types
  df['embedding'] = df['embedding'].apply(lambda x: json.dumps(x) if x else None)
  save_sqlite(df, f'{filename}.db')


def get_updated_docs(old, new):
  # merge the two dataframes on the filename
  temp = pd.merge(old, new, on='filename', how='right', suffixes=('_old', '_new'))

  # check if the checksum is different
  updated = temp[(temp['checksum_old'] != temp['checksum_new']) | temp['embedding'].isnull()]

  # get the updated documents
  result = updated[['filename', 'text_new', 'checksum_new']]
  result.columns = ['filename', 'text', 'checksum']
  return result.reset_index(drop=True)


def merge_docs(old, new):
  old_indexed = old.set_index('filename')
  new_indexed = new.set_index('filename')

  old_indexed.update(new_indexed)
  result = pd.concat([old_indexed, new_indexed])
  result = result[~result.index.duplicated(keep='last')]

  return result.reset_index()


def main(docs_path, db_file='output_embeddings.db', output_file='output_embeddings'):
  """
  메인 함수: 문서를 읽고 embedding을 생성하여 DB에 저장

  Args:
    docs_path: 문서 디렉토리 경로
    db_file: 기존 embedding DB 파일 경로
    output_file: 출력 파일 경로 (확장자 제외)
  """
  df = load_embeddings(db_file)
  df_docs = read_docs(docs_path)

  df_updated_docs = get_updated_docs(df, df_docs)
  df_updated_docs = update_token(df_updated_docs)

  logging.info(f'Updated docs: {df_updated_docs.shape[0]}')
  df_updated_docs = get_embeddings(df_updated_docs)

  if df_updated_docs.shape[0] == 0:
    logging.info('No updated documents found.')
    return

  df = merge_docs(df, df_updated_docs)
  persist_embeddings(df, output_file)

  logging.info(df)
  logging.info(df.dtypes)


if __name__ == '__main__':
  """
  $ python src/get_embeddings.py ../docs/wiki
  """
  docs_path = sys.argv[1]
  db_file = sys.argv[2] if len(sys.argv) > 2 else 'output_embeddings.db'
  main(docs_path, db_file)
