from pydantic import BaseModel, ConfigDict

#Clase base de pydantic
class DepartamentoBase(BaseModel):
    empresa : str
    zona    : str
    subarea : str

#Hereda de Base, representa datos para crear
class DepartamentoCreate(DepartamentoBase):
    """Lo que el cliente manda al POST"""
    pass

#No hereda base, todos los campos son opcionales
class DepartamentoUpdate(BaseModel):
    """PUT: todos los campos opcionales"""
    empresa : str | None = None
    zona    : str 
    subarea : str 

class DepartamentoOut(DepartamentoBase):
    """Lo que la API devuelve"""
    id_dpto: int

    #Le dice a Pydantic "convierte un objeto SQLAlchemy a este schema leyendo sus atributos"
    model_config = ConfigDict(from_attributes=True)

