from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

class HistorialEstadoBase(BaseModel):
    fecha_reg       :datetime
    descr           :Optional[str]=None
    causa           :str |None = Field(default=None, max_length=50) 

    id_tipoe        :int
    id_act          :int

class HistorialEstadoCreate(HistorialEstadoBase):
    pass


class HistorialEstadoOut(HistorialEstadoBase):
    id_hes          :int
    
    model_config = ConfigDict(from_attributes=True)
