from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class EmpleadoBase(BaseModel):
    rut: str
    nombre: str
    email: str
    id_cargo: int
    id_planta: int
    operatividad: bool = True
    id_dpto: int | None = None
    id_sub: int | None = None


class EmpleadoCreate(EmpleadoBase):
    pass


class InformaticoCreate(BaseModel):
    id_emp: int
    password: str = Field(min_length=8, max_length=128)
    rol: Literal["editor", "auditor"]
    vigente: bool = True


class EmpleadoUpdate(BaseModel):
    rut: str | None = None
    nombre: str | None = None
    email: str | None = None
    id_cargo: int | None = None
    id_planta: int | None = None
    operatividad: bool | None = None
    id_dpto: int | None = None
    id_sub: int | None = None


class InformaticoUpdate(BaseModel):
    password: str | None = Field(default=None, min_length=8, max_length=128)
    rol: Literal["editor", "auditor"] | None = None
    vigente: bool | None = None


class EmpleadoOut(EmpleadoBase):
    id_emp: int
    model_config = ConfigDict(from_attributes=True)


class InformaticoOut(BaseModel):
    id_emp: int
    rol: Literal["editor", "auditor"]
    vigente: bool
    model_config = ConfigDict(from_attributes=True)
