from collections.abc import Iterator
from contextlib import suppress
import os
from pathlib import Path
import socket
import subprocess
import time
from urllib.error import URLError
from urllib.request import urlopen

import pytest


ROOT_DIR = Path(__file__).resolve().parents[1]


def get_free_port() -> int:
    with socket.socket() as server_socket:
        server_socket.bind(("127.0.0.1", 0))
        return int(server_socket.getsockname()[1])


def wait_for_url(url: str, timeout: float = 30.0) -> None:
    deadline = time.monotonic() + timeout
    last_error: Exception | None = None

    while time.monotonic() < deadline:
        try:
            with urlopen(url, timeout=1):
                return
        except URLError as error:
            last_error = error
        time.sleep(0.25)

    raise RuntimeError(f"Сервис не ответил по адресу {url}") from last_error


def start_process(command: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> subprocess.Popen[str]:
    return subprocess.Popen(
        command,
        cwd=cwd,
        env={**os.environ, **(env or {})},
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def stop_process(process: subprocess.Popen[str]) -> None:
    if process.poll() is not None:
        return

    process.terminate()
    with suppress(subprocess.TimeoutExpired):
        process.wait(timeout=5)
        return

    process.kill()
    process.wait(timeout=5)


@pytest.fixture(scope="session")
def app_url() -> Iterator[str]:
    backend_port = get_free_port()
    frontend_port = get_free_port()
    backend_url = f"http://127.0.0.1:{backend_port}"
    frontend_url = f"http://127.0.0.1:{frontend_port}"

    backend = start_process(
        [
            "uv",
            "run",
            "--directory",
            "backend",
            "fastapi",
            "run",
            "app/main.py",
            "--host",
            "127.0.0.1",
            "--port",
            str(backend_port),
        ],
        cwd=ROOT_DIR,
        env={"CORS_ALLOW_ORIGINS": frontend_url},
    )
    try:
        wait_for_url(f"{backend_url}/api/event-types")

        frontend = start_process(
            [
                "npm",
                "--prefix",
                "frontend",
                "run",
                "dev",
                "--",
                "--host",
                "127.0.0.1",
                "--port",
                str(frontend_port),
                "--strictPort",
            ],
            cwd=ROOT_DIR,
            env={"VITE_API_BASE_URL": f"{backend_url}/api"},
        )
        try:
            wait_for_url(frontend_url)
            yield frontend_url
        finally:
            stop_process(frontend)
    finally:
        stop_process(backend)


@pytest.fixture(autouse=True)
def set_default_timeout(page) -> None:
    page.set_default_timeout(10_000)
