FROM python:3.10-slim

COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry install --only main --no-root --no-directory

COPY src/ ./src
