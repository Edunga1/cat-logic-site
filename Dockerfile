FROM python:3.10-slim

WORKDIR /app

COPY pyproject.toml poetry.lock ./

RUN pip install poetry
RUN poetry config virtualenvs.create false
RUN poetry install --only main --no-root --no-directory

CMD python src/get_embeddings.py target/**/*.md
