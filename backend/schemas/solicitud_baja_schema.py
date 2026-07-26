from pydantic import BaseModel, ConfigDict, Field
from datetime import date

ESTADOS_RESOLUCION = ("aprobada", "rechazada")


class SolicitudBajaBase(BaseModel):
    motivo_baja : str = Field(max_length=200)
    id_act      : int


class SolicitudBajaCreate(SolicitudBajaBase):
    pass


# Registra la resolución (aprobación/rechazo) decidida por fuera del sistema.
class SolicitudBajaResolver(BaseModel):
    estado_sol   : str = Field(pattern="^(aprobada|rechazada)$")
    ref_aprob    : str | None = Field(default=None, max_length=200)
    id_emp_aprob : int | None = None


# Cierra el proceso registrando el borrado seguro de datos del activo.
class SolicitudBajaBorrado(BaseModel):
    ruta_acta_baja: str | None = Field(default=None, max_length=255)


class SolicitudBajaOut(SolicitudBajaBase):
    id_solbaja       : int
    fecha_solicitud  : date
    fecha_resolucion : date | None = None
    ref_aprob        : str | None = None
    estado_sol       : str
    ruta_acta_baja   : str | None = None
    fecha_borrado    : date | None = None

    id_emp_sol      : int
    id_emp_aprob    : int | None = None
    id_emp_borrado  : int | None = None

    model_config = ConfigDict(from_attributes=True)
