from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from typing import Literal   


class ChecklistBase(BaseModel):
    nombre      :str  = Field(max_length=50)
    fecha_ini   :date | None = None 
    fecha_ter   :date | None = None
    id_emp      :int  | None = None

class ChecklistCreate(ChecklistBase):
    pass

class ChecklistUpdate(BaseModel):
    nombre      : str  | None = Field(default=None, max_length=50)
    fecha_ter   : date | None = None

class ChecklistOut(ChecklistBase):
    id_check    :int

    model_config = ConfigDict(from_attributes=True)


#####################################################
#####################################################

class CheckPlantillaBase(BaseModel):
    estado      :Literal["pendiente", "completado", "no_aplica", "en_proceso"]
    observacion :str | None = Field(default=None, max_length=255)

    id_check    :int
    id_ip       :int

class CheckPlantillaCreate(CheckPlantillaBase):
    pass

class CheckPlantillaUpdate(BaseModel):
    estado      : Literal["pendiente", "completado", "no_aplica", "en_proceso"] | None = None
    observacion : str | None = Field(default=None, max_length=255)

#################################################
#####################################################


class PlantillaBase(BaseModel):
    descr   :str | None = None
    orden   :int

class PlantillaCreate(PlantillaBase):
    pass
class PlantillaUpdate(BaseModel):
    descr   : str | None = None
    orden   : int | None = None
class PlantillaOut(PlantillaBase):
    id_ip   :int

    model_config = ConfigDict(from_attributes=True)

class PlantillaSimple(BaseModel):
    id_ip: int
    descr: str | None
    orden: int

    model_config = ConfigDict(from_attributes=True)

############################################################
############################################################

class CheckPlantillaOut(CheckPlantillaBase):
    #para acceder a datos anidados
    checklist: ChecklistOut
    plantilla: PlantillaSimple
    model_config = ConfigDict(from_attributes=True)
