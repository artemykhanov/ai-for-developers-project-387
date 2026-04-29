import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.routers.owner import router as owner_router
from app.routers.public import router as public_router

app = FastAPI(title="CalKing API")

cors_allow_origins = os.environ.get("CORS_ALLOW_ORIGINS")
allowed_origins = cors_allow_origins.split(",") if cors_allow_origins else ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
def validation_exception_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={
            "statusCode": 400,
            "code": "bad_request",
            "message": exc.errors()[0]["msg"] if exc.errors() else "Некорректный запрос.",
        },
    )


@app.exception_handler(HTTPException)
def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict) and {"statusCode", "code", "message"} <= exc.detail.keys():
        return JSONResponse(status_code=exc.status_code, content=exc.detail)

    return JSONResponse(
        status_code=exc.status_code,
        content={"statusCode": exc.status_code, "code": "bad_request", "message": str(exc.detail)},
    )


app.include_router(public_router)
app.include_router(owner_router)

static_dir = Path(__file__).resolve().parent.parent / "static"
index_file = static_dir / "index.html"
assets_dir = static_dir / "assets"

if index_file.exists():
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    def serve_frontend_root() -> FileResponse:
        return FileResponse(index_file)

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str) -> FileResponse:
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail={"statusCode": 404, "code": "not_found", "message": "Маршрут не найден."})

        static_file = static_dir / full_path
        if static_file.is_file():
            return FileResponse(static_file)

        return FileResponse(index_file)
