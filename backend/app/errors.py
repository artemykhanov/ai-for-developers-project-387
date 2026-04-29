from fastapi import HTTPException


def api_error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"statusCode": status_code, "code": code, "message": message},
    )


def bad_request(message: str) -> HTTPException:
    return api_error(400, "bad_request", message)


def not_found(message: str) -> HTTPException:
    return api_error(404, "not_found", message)


def slot_unavailable(message: str = "Выбранный слот больше недоступен.") -> HTTPException:
    return api_error(409, "slot_unavailable", message)
