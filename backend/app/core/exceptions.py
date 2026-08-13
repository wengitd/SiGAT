"""Excepciones de dominio y registro de handlers HTTP."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Error de aplicación con código HTTP asociado."""

    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class NotFoundError(AppError):
    def __init__(self, detail: str = "Recurso no encontrado"):
        super().__init__(detail=detail, status_code=404)


class ConflictError(AppError):
    def __init__(self, detail: str = "Conflicto con el estado actual"):
        super().__init__(detail=detail, status_code=409)


class ForbiddenError(AppError):
    def __init__(self, detail: str = "Operación no permitida"):
        super().__init__(detail=detail, status_code=403)


def register_exception_handlers(app: FastAPI) -> None:
    """Registra handlers para excepciones de dominio."""

    @app.exception_handler(AppError)
    async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
