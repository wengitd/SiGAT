"""Schemas compartidos: errores estándar y envelopes comunes."""

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Formato estándar de error HTTP."""

    detail: str


class MessageResponse(BaseModel):
    """Respuesta simple con mensaje."""

    message: str


class PaginatedMeta(BaseModel):
    """Metadatos de paginación."""

    total: int = Field(ge=0)
    page: int = Field(ge=1, default=1)
    page_size: int = Field(ge=1, default=50)
