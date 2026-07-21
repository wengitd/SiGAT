from pydantic import BaseModel, ConfigDict

class DisponibilidadBase(BaseModel):
    nombre: str
    descr:  str
    color:  str | None = None   # valor MUI: "success", "warning", "error", "info", "primary", "default"

class DisponibilidadCreate(DisponibilidadBase):
    pass

class DisponibilidadUpdate(BaseModel):
    nombre: str | None = None
    descr:  str | None = None
    color:  str | None = None

class DisponibilidadOut(DisponibilidadBase):
    id_dispo: int
    model_config = ConfigDict(from_attributes=True)


# --- EstadoDispo ---
class EstadoDispoCreate(BaseModel):
    id_tipoe: int
    id_dispo: int

class EstadoDispoOut(BaseModel):
    id_tipoe: int
    id_dispo: int
    model_config = ConfigDict(from_attributes=True)