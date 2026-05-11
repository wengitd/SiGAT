from pydantic import BaseModel, ConfigDict, Field

#este schema es en base a una relacion, no una entidad
#es más simple que las entidades.

class EmpleadoLicenciaCreate(BaseModel):
    """Cuerpo del POST: a qué empleado le asignamos qué licencia."""
    id_emp: int
    id_lic: int

class EmpleadoLicenciaOut(BaseModel):
    """Devuelve la asignacion"""
    id_emp: int
    id_lic: int

    model_config = ConfigDict(from_attributes=True)
