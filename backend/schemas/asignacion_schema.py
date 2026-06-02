from pydantic import BaseModel, ConfigDict, Field
from datetime import date

class AsignacionBase(BaseModel):
    fecha_entr      :date
    fecha_dev       :date | None = None
    ruta_acta_entr  :str  | None = Field(default=None, max_length=255)

    id_act          :int
    id_emp          :int
    id_emp_reg      :int | None = None
 
class AsignacionCreate(AsignacionBase):
    pass

class AsignacionUpdate(BaseModel):
    fecha_dev      : date                
    ruta_acta_entr : str | None = Field(default=None, max_length=255)  


class AsignacionOut(AsignacionBase):
    id_asig         :int

    model_config = ConfigDict(from_attributes=True)
