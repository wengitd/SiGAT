from pydantic import BaseModel, ConfigDict, Field
from datetime import date

class LicenciaBase(BaseModel):
    fecha_ini: date 
    fecha_exp: date
    proveedor: str
    ver_licen: str

class LicenciaCreate(LicenciaBase):
    pass

class LicenciaUpdate(BaseModel):
    fecha_ini: date
    fecha_exp: date
    proveedor: str
    ver_licen: str

class LicenciaOut(LicenciaBase):
    id_lic: int
    
    model_config = ConfigDict(from_attributes=True)


