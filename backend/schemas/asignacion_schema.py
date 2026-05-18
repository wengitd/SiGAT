from pydantic import BaseModel, ConfigDict, Field
from datetime import date

class AsignacionBase(BaseModel):
    fecha_entr      :date
    fecha_dev       :date | None = None
    ruta_acta_entr  :str  | None = Field(default=None, max_length=255)
    operatividad    :bool =True 

    id_act          :int
    id_emp          :int
 
class AsignacionCreate(BaseModel):
    fecha_entr      :date
    ruta_acta_entr  :str  | None = Field(default=None, max_length=255)
    operatividad    :bool =True 

    id_act          :int
    id_emp          :int

class AsignacionUpdate(BaseModel):
    fecha_dev       :date 
   

class AsignacionOut(AsignacionBase):
    id_asig         :int

    model_config = ConfigDict(from_attributes=True)
