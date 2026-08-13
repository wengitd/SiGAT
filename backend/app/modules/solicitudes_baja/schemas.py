from datetime import date

from pydantic import BaseModel, ConfigDict, Field

ESTADOS_RESOLUCION = ("Aprobada", "Rechazada")


class SolicitudBajaBase(BaseModel):
    motivo_baja: str = Field(max_length=200)
    id_act: int


class SolicitudBajaCreate(SolicitudBajaBase):
    id_tipoe: int  # nueva condición del activo (regular o malo) al solicitar la baja


# Registra la resolución (aprobación/rechazo) decidida por fuera del sistema.
class SolicitudBajaResolver(BaseModel):
    estado_sol: str = Field(pattern="^(Aprobada|Rechazada)$")
    ref_aprob: str | None = Field(default=None, max_length=200)
    id_usuario_aprob: int | None = None


# Cierra el proceso registrando el borrado seguro de datos del activo.
class SolicitudBajaBorrado(BaseModel):
    ruta_acta_baja: str | None = Field(default=None, max_length=255)


class SolicitudBajaOut(SolicitudBajaBase):
    id_solbaja: int
    fecha_solicitud: date
    fecha_resolucion: date | None = None
    ref_aprob: str | None = None
    estado_sol: str
    ruta_acta_baja: str | None = None
    fecha_borrado: date | None = None

    id_usuario_sol: int
    id_usuario_aprob: int | None = None
    id_usuario_borrado: int | None = None

    model_config = ConfigDict(from_attributes=True)
