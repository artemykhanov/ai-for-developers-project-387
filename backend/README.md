# CalKing Backend

FastAPI backend для CalKing. Данные хранятся в памяти процесса и сбрасываются при перезапуске.

## Установка

```bash
uv sync --project backend
```

## Запуск Для Разработки

```bash
uv run --directory backend fastapi dev app/main.py
```

API будет доступен на `http://localhost:8000/api`.
