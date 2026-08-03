from datetime import date

from pydantic import BaseModel, ConfigDict

# Schema basado en la relación empleado–licencia (no es una entidad propia).


class EmpleadoLicenciaCreate(BaseModel):
    """Cuerpo del POST: a qué empleado le asignamos qué licencia."""

    id_emp: int
    id_lic: int


class EmpleadoLicenciaOut(BaseModel):
    """Devuelve la asignación básica."""

    id_emp: int
    id_lic: int
    fecha_asignacion: date

    model_config = ConfigDict(from_attributes=True)


class EmpleadoLicenciaDetalleOut(BaseModel):
    """Asignación enriquecida con datos del contrato de licencia."""

    id_emp: int
    id_lic: int
    proveedor: str
    version: str
    fecha_asignacion: date
