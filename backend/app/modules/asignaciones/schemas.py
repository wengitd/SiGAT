from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _validar_fecha_no_futura(v: date | None) -> date | None:
    if v is not None and v > date.today():
        raise ValueError("La fecha no puede ser posterior a la fecha actual")
    return v


class AsignacionBase(BaseModel):
    fecha_entr: date
    fecha_dev: date | None = None
    ruta_acta_entr: str | None = Field(default=None, max_length=255)

    id_act: int
    id_emp: int

    @field_validator("fecha_entr", "fecha_dev")
    @classmethod
    def _fechas_no_futuras(cls, v):
        return _validar_fecha_no_futura(v)


class AsignacionCreate(AsignacionBase):
    pass


class AsignacionUpdate(BaseModel):
    fecha_dev: date
    ruta_acta_entr: str | None = Field(default=None, max_length=255)

    @field_validator("fecha_dev")
    @classmethod
    def _fecha_dev_no_futura(cls, v):
        return _validar_fecha_no_futura(v)


class AsignacionOut(AsignacionBase):
    id_asig: int
    id_usuario_reg: int | None = None

    model_config = ConfigDict(from_attributes=True)
