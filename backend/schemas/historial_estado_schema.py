from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional


class HistorialEstadoBase(BaseModel):
    descr: str | None = None
    causa: str = Field(default=None, max_length=50)

    id_tipoe: int
    id_act: int
    id_usuario_reg: int | None = None


class HistorialEstadoCreate(HistorialEstadoBase):
    pass


class HistorialEstadoOut(HistorialEstadoBase):
    fecha_reg: datetime
    id_hes: int

    model_config = ConfigDict(from_attributes=True)
