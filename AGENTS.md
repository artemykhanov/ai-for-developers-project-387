# AGENTS.md

## Структура
- Корень содержит TypeSpec-контракт `api/main.tsp`; `npm run typespec:compile` генерирует `tsp-output/@typespec/openapi3/openapi.yaml`.
- `frontend/` — отдельный Vite/React npm-пакет со своим `package-lock.json`; команды запускай через корневые npm-скрипты или `npm --prefix frontend ...`.
- `backend/` — отдельный `uv`-проект FastAPI; entrypoint указан в `backend/pyproject.toml` как `app.main:app`.
- `tests/` — отдельный `uv`-проект e2e-тестов на `pytest` и `playwright`; сценарии описаны в `tests/README.md`.
- API-типы фронтенда в `frontend/src/api/types.ts` написаны вручную, не генерируются; при изменении `api/main.tsp` держи их синхронными с контрактом и backend.

## Команды
- Установка основных зависимостей: `make install` (`npm install`, `npm --prefix frontend install`, `uv sync --project backend`).
- E2E-зависимости и Chromium: `make tests-install`.
- OpenAPI из TypeSpec: `make api-openapi`.
- Mock API через Prism: `make api-mock`; сначала компилирует TypeSpec, затем поднимает mock на `0.0.0.0:3000`.
- Backend dev с reload: `make backend-dev`; production-like запуск: `make backend-run`.
- Backend smoke-check: `make backend-check` (`uv run --directory backend python -m compileall app`).
- Frontend dev: `make frontend-dev`; typecheck без Vite: `make frontend-typecheck`; полная сборка: `make frontend-build`.
- E2E: `make tests-e2e`; фикстуры сами запускают backend и frontend на свободных портах.
- В репозитории нет lint/format скриптов; основной `.github/workflows/ci.yml` сейчас отключен через `if: ${{ false }}`.

## Runtime И Деплой
- API backend доступен под `/api`; публичные SPA-маршруты: `/` и `/owner`.
- Дефолтный `VITE_API_BASE_URL` во frontend — относительный `/api`; для раздельного локального backend передавай `VITE_API_BASE_URL=http://localhost:8000/api`.
- CORS origins FastAPI задаются через `CORS_ALLOW_ORIGINS` списком через запятую; e2e-тесты используют это для динамического frontend-порта.
- В Docker-образе FastAPI отдает собранный `frontend/dist` из `backend/static` и делает SPA fallback на `index.html`; без `backend/static/index.html` backend работает как обычный API-only dev server.
- Render настроен через `render.yaml` как Docker web service `calking`; публичный URL: https://calking.onrender.com.
- Для Docker-проверки локально: `docker build -t calking-render .`, затем `docker run --rm -p 8000:8000 -e PORT=8000 calking-render`.

## Доменные Ограничения
- В приложении один заранее заданный владелец календаря (`owner_default`, `Europe/Moscow`); регистрации, входа и модели нескольких владельцев нет.
- Данные backend хранятся в памяти процесса и сбрасываются при рестарте/deploy.
- Слоты рассчитываются динамически на ближайшие 14 дней, рабочее окно владельца — 09:00-18:00.
- Пересечения бронирований запрещены независимо от типа события; при гонке создания бронирования сервер должен возвращать `409` с кодом `slot_unavailable`.

## Рабочие Правила
- Документацию, тексты интерфейса и примеры данных пиши на русском.
- Не редактируй `.github/workflows/hexlet-check.yml`: файл сгенерирован Hexlet и об этом прямо сказано в `.github/workflows/README.md`.
- При изменении API-операций обновляй `api/main.tsp`, запускай `make api-openapi`, затем синхронизируй `backend/app/routers/*`, `frontend/src/api/client.ts` и `frontend/src/api/types.ts`.
- При изменении пользовательских сценариев обновляй e2e-тесты в `tests/` и описание сценариев в `tests/README.md`.
