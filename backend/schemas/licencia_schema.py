from datetime import date

from pydantic import BaseModel, ConfigDict


class LicenciaBase(BaseModel):
    fecha_ini: date | None = None
    fecha_exp: date | None = None
    id_prov: int
    id_ver: int


class LicenciaCreate(LicenciaBase):
    pass


class LicenciaUpdate(BaseModel):
    fecha_ini: date | None = None
    fecha_exp: date | None = None
    id_prov: int | None = None
    id_ver: int | None = None


class LicenciaOut(LicenciaBase):
    id_lic: int
    model_config = ConfigDict(from_attributes=True)
