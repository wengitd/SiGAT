"""Schemas de autenticación."""

from pydantic import BaseModel, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResult(BaseModel):
    """Resultado interno del login (antes de emitir token)."""

    id_usuario: int
    rol: str
    nombre: str
    email: str = Field(min_length=1)
