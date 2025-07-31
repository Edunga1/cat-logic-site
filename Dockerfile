FROM python:3.10-slim

ENV UV_LINK_MODE=copy

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN pip install uv
RUN uv sync --frozen
