# Introduction

Embedding scripts for cat-logic.

## Usage

To get the similiarity result between documents, there are two steps.

1. Embed the documents

```bash
cp -r ../docs/wiki target
AZURE_OPENAI_API_KEY=your-api-key uv run src/get_embeddings.py target
```

this will generate `output_embeddings.csv` that contains the embeddings of the documents.

2. Calculate the similarity

```bash
uv run src/cosine_similarity.py output_embeddings.csv
```

this will generate `similarity-result.json`.
json file contains _doc1 - doc2 - similarity score_ pairs.

## with Docker

Build the image:

```bash
docker build -t embeddings .
```

Get the embeddings and calculate the similarity:

```bash
cp -r ../docs/wiki target
export AZURE_OPENAI_API_KEY=your-api-key
docker run --rm -t -i -v `pwd`:/app -e AZURE_OPENAI_API_KEY=$AZURE_OPENAI_API_KEY embeddings uv run src/get_embeddings.py target
```

Convert the embeddings to similarity result. this will generate `similarity-result.json`.:

```bash
docker run --rm -t -i -v `pwd`:/app embeddings uv run src/cosine_similarity.py output_embeddings.csv
```
