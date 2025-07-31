#!/bin/bash

if [ -d "target" ]; then
  rm -rf target
fi

cp -r ../docs/wiki target

docker run \
  --rm -ti \
  -v .:/app \
  -v /app/.venv \
  -e AZURE_OPENAI_API_KEY=$AZURE_OPENAI_API_KEY \
  embeddings \
  uv run src/get_embeddings.py target

docker run \
  --rm -ti \
  -v .:/app \
  -v /app/.venv \
  embeddings \
  uv run src/cosine_similarity.py output_embeddings.csv

cp similarity-result.json ../sites/src/related-docs/similarity-result.json
