from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DepartamentoBase(BaseModel):
    id_org: int
    zona: Literal["Administracion", "Operaciones", "Produccion"]
    nom_dpto: str = Field(max_length=100)


class DepartamentoCreate(DepartamentoBase):
    pass


class DepartamentoUpdate(BaseModel):
    id_org: int | None = None
    zona: Literal["Administracion", "Operaciones", "Produccion"] | None = None
    nom_dpto: str | None = Field(default=None, max_length=100)


class DepartamentoOut(DepartamentoBase):
    id_dpto: int
    model_config = ConfigDict(from_attributes=True)
