from pydantic import BaseModel, ConfigDict


class LicenciaBase(BaseModel):
    id_prov: int
    id_ver: int


class LicenciaCreate(LicenciaBase):
    pass


class LicenciaUpdate(BaseModel):
    id_prov: int | None = None
    id_ver: int | None = None


class LicenciaOut(LicenciaBase):
    id_lic: int
    proveedor: str = "N/A"
    version: str = "N/A"
    model_config = ConfigDict(from_attributes=True)
