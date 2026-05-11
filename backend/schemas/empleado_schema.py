from pydantic import BaseModel, ConfigDict, Field
#field agrega validacion a un campo pydantic.

#clase base
class EmpleadoBase (BaseModel):
    rut         :str
    nombre      :str
    email       :str
    cargo       :str
    planta      :str
    operatividad:bool = True
    id_dpto     :int | None=None

#hereda de base, representa datos para crear
class EmpleadoCreate(EmpleadoBase):
    pass

class InformaticoCreate(BaseModel):
    """Lo que el cliente manda: password en plano."""
    id_emp  : int
    password: str = Field(min_length=8, max_length=128) 
    rol     : str
    vigente : bool

class EmpleadoUpdate(BaseModel):
    rut         :str | None = None
    nombre      :str | None = None
    email       :str | None = None
    cargo       :str | None = None
    planta      :str | None = None
    operatividad:bool| None = None
    id_dpto     :int | None=None

class InformaticoUpdate(BaseModel):
    password: str | None = Field(default=None, min_length=8, max_length=128)
    rol     : str | None = None
    vigente : bool| None = None

class EmpleadoOut(EmpleadoBase):
    id_emp  : int
    model_config = ConfigDict(from_attributes=True)


class InformaticoOut(BaseModel):
    id_emp  : int
    rol     : str
    vigente : bool
    model_config = ConfigDict(from_attributes=True)



