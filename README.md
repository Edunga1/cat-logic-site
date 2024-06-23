# Introduction

Embedding scripts for cat-logic.

## Usage

To get the similiarity result between documents, there are two steps.

1. Embed the documents

```bash
$ OPENAI_API_KEY=your-openai-api-key python src/get_embeddings.py "../docs/wiki/**/*.md"
```

this will generate `output_embeddings.csv` that contains the embeddings of the documents.

2. Calculate the similarity

```bash
$ python src/cosine_similarity.py output_embeddings.csv
```

this will generate `similarity_result.json`.
json file contains _doc1 - doc2 - similarity score_ pairs.

## with Docker

```bash
$ cp -r ../docs/wiki target
$ docker run --rm -t -i -v `pwd`:/app -e OPENAI_API_KEY=<KEY> embedding
```
