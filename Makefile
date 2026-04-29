.PHONY: install api-openapi api-mock backend-install backend-dev backend-run backend-check frontend-dev frontend-build frontend-typecheck tests-install tests-e2e

install:
	npm install
	npm --prefix frontend install
	uv sync --project backend

api-openapi:
	npm run typespec:compile

api-mock:
	npm run frontend:mock:api

backend-install:
	uv sync --project backend

backend-dev:
	uv run --directory backend fastapi dev app/main.py

backend-run:
	uv run --directory backend fastapi run app/main.py

backend-check:
	uv run --directory backend python -m compileall app

frontend-dev:
	npm run frontend:dev

frontend-build:
	npm run frontend:build

frontend-typecheck:
	npm --prefix frontend run typecheck

tests-install:
	uv sync --project tests
	uv run --project tests playwright install chromium

tests-e2e:
	uv run --project tests pytest --browser chromium
