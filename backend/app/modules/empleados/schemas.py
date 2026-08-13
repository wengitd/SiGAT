from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# schema anidado
class CargoOut(BaseModel):
    id_cargo: int
    nombre: str
    model_config = ConfigDict(from_attributes=True)


# schema anidado
class PlantaOut(BaseModel):
    id_planta: int
    nombre: str
    model_config = ConfigDict(from_attributes=True)


# schema anidado
class DepartamentoSimple(BaseModel):
    id_dpto: int
    nom_dpto: str
    model_config = ConfigDict(from_attributes=True)


# schema anidado
class EmpleadoBasico(BaseModel):
    id_emp: int
    nombre: str
    email: str
    model_config = ConfigDict(from_attributes=True)


class EmpleadoCreate(BaseModel):
    rut: str
    nombre: str
    email: EmailStr
    cargo: str = Field(max_length=100)
    planta: str = Field(max_length=100)
    id_dpto: int | None = None
    operatividad: bool = True
    id_sub: int | None = None


class EmpleadoUpdate(BaseModel):
    rut: str | None = None
    nombre: str | None = None
    email: EmailStr | None = None
    cargo: str | None = Field(default=None, max_length=100)
    planta: str | None = Field(default=None, max_length=100)
    nom_dpto: str | None = Field(default=None, max_length=100)
    operatividad: bool | None = None
    id_dpto: int | None = None
    id_sub: int | None = None


class EmpleadoOut(BaseModel):
    id_emp: int
    rut: str
    nombre: str
    email: str
    operatividad: bool
    cargo: CargoOut
    planta: PlantaOut
    departamento: DepartamentoSimple | None = None
    # True si no tiene asociaciones y puede hard-deletearse
    puede_eliminar: bool = False
    model_config = ConfigDict(from_attributes=True)



