from pydantic import BaseModel, ConfigDict


# Clase base de pydantic
class TipoEstadoBase(BaseModel):
    nombre: str
    descr: str | None = None
    operatividad: bool = True


# Hereda de Base, representa datos para crear
class TipoEstadoCreate(TipoEstadoBase):
    """Lo que el cliente manda al POST"""

    pass


# No hereda base, todos los campos son opcionales
class TipoEstadoUpdate(BaseModel):
    """PUT: todos los campos opcionales"""

    nombre: str | None = None
    descr: str | None = None
    operatividad: bool | None = None


class TipoEstadoOut(TipoEstadoBase):
    """Lo que la API devuelve"""

    id_tipoe: int

    # Le dice a Pydantic "convierte un objeto SQLAlchemy a este schema leyendo sus atributos"
    model_config = ConfigDict(from_attributes=True)
