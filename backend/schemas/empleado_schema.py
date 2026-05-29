from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class EmpleadoCreate(BaseModel):
    rut: str
    nombre: str
    email: str
    cargo: str = Field(max_length=100)
    planta: str = Field(max_length=100)
    nom_dpto: str | None = Field(default=None, max_length=100)
    operatividad: bool = True


class EmpleadoUpdate(BaseModel):
    rut: str | None = None
    nombre: str | None = None
    email: str | None = None
    cargo: str | None = Field(default=None, max_length=100)
    planta: str | None = Field(default=None, max_length=100)
    nom_dpto: str | None = Field(default=None, max_length=100)
    operatividad: bool | None = None


class EmpleadoOut(BaseModel):
    id_emp: int
    rut: str
    nombre: str
    email: str
    cargo: str
    planta: str
    nom_dpto: str | None = None
    operatividad: bool


class InformaticoCreate(BaseModel):
    id_emp: int
    password: str = Field(min_length=8, max_length=128)
    rol: Literal["editor", "auditor"]
    vigente: bool = True


class InformaticoUpdate(BaseModel):
    password: str | None = Field(default=None, min_length=8, max_length=128)
    rol: Literal["editor", "auditor"] | None = None
    vigente: bool | None = None


class InformaticoOut(BaseModel):
    id_emp: int
    rol: Literal["editor", "auditor"]
    vigente: bool
    model_config = ConfigDict(from_attributes=True)
