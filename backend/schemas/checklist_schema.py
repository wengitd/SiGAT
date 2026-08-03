from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


PropositoChecklist = Literal["preparacion", "reasignacion"]
EstadoChecklist = Literal["abierto", "cerrado", "cancelado"]
EstadoPaso = Literal["pendiente", "completado", "no_aplica", "en_proceso"]


# ── Plantilla paso ────────────────────────────────────────────────────────────


class PlantillaPasoBase(BaseModel):
    descr: str
    orden: int
    activo: bool = True


class PlantillaPasoCreate(PlantillaPasoBase):
    pass


class PlantillaPasoUpdate(BaseModel):
    descr: str | None = None
    orden: int | None = None
    activo: bool | None = None


class PlantillaPasoOut(PlantillaPasoBase):
    id_paso: int
    id_plantilla: int

    model_config = ConfigDict(from_attributes=True)


# ── Plantilla ─────────────────────────────────────────────────────────────────


class PlantillaBase(BaseModel):
    nombre: str = Field(max_length=100)
    proposito: PropositoChecklist
    vigente: bool = True


class PlantillaCreate(PlantillaBase):
    pasos: list[PlantillaPasoCreate] = []


class PlantillaUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)
    vigente: bool | None = None


class PlantillaOut(PlantillaBase):
    id_plantilla: int
    pasos: list[PlantillaPasoOut] = []

    model_config = ConfigDict(from_attributes=True)


# ── Checklist paso ────────────────────────────────────────────────────────────


class ChecklistPasoOut(BaseModel):
    id_cpaso: int
    id_check: int
    id_paso: int | None = None
    orden: int
    descr: str
    estado: EstadoPaso
    observacion: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ChecklistPasoUpdate(BaseModel):
    estado: EstadoPaso | None = None
    observacion: str | None = Field(default=None, max_length=255)


# ── Checklist ─────────────────────────────────────────────────────────────────


class ChecklistOut(BaseModel):
    id_check: int
    nombre: str
    fecha_ini: date | None = None
    fecha_ter: date | None = None
    proposito: PropositoChecklist
    estado: EstadoChecklist
    id_usuario: int | None = None
    id_act: int
    id_asig: int | None = None
    id_plantilla: int | None = None
    nombre_plantilla: str | None = None
    pasos: list[ChecklistPasoOut] = []

    model_config = ConfigDict(from_attributes=True)


class ChecklistIniciar(BaseModel):
    id_act: int
    proposito: PropositoChecklist
    id_plantilla: int


class ElegibilidadOut(BaseModel):
    puede: bool
    motivo: str | None = None
    checklist_abierto: ChecklistOut | None = None
    checklist_requerido: PropositoChecklist | None = None
