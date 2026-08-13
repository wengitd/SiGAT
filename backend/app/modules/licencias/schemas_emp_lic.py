from datetime import date

from pydantic import BaseModel, ConfigDict


class EmpleadoLicenciaCreate(BaseModel):
    """Cuerpo del POST: versión de licencia (con su proveedor) a asignar."""

    id_emp: int
    id_ver: int


class EmpleadoLicenciaOut(BaseModel):
    """Asignación persistida."""

    id_emp: int
    id_ver: int
    fecha_asignacion: date

    model_config = ConfigDict(from_attributes=True)


class EmpleadoLicenciaDetalleOut(BaseModel):
    """Asignación enriquecida con proveedor y versión del catálogo."""

    id_emp: int
    id_ver: int
    id_prov: int
    proveedor: str
    version: str
    fecha_asignacion: date
