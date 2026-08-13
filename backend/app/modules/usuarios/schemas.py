from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UsuarioSistemaCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    rol: Literal["Editor", "Auditor", "Admin"]
    vigente: bool = True


class UsuarioSistemaUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
    rol: Literal["Editor", "Auditor", "Admin"] | None = None
    vigente: bool | None = None


class UsuarioSistemaOut(BaseModel):
    id_usuario: int
    nombre: str
    email: EmailStr
    rol: Literal["Editor", "Auditor", "Admin"]
    vigente: bool
    # True si no tiene asociaciones y puede hard-deletearse
    puede_eliminar: bool = False
    model_config = ConfigDict(from_attributes=True)
