FROM node:24-slim AS frontend-build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm --prefix frontend ci

COPY frontend ./frontend
RUN npm --prefix frontend run build

FROM ghcr.io/astral-sh/uv:python3.14-bookworm-slim

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/backend/.venv/bin:$PATH"

COPY backend/pyproject.toml backend/uv.lock ./backend/
RUN uv sync --frozen --no-dev --project backend

COPY backend/app ./backend/app
COPY --from=frontend-build /app/frontend/dist ./backend/static

WORKDIR /app/backend

CMD ["sh", "-c", "fastapi run app/main.py --host 0.0.0.0 --port ${PORT:-8000}"]
