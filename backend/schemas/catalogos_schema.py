from pydantic import BaseModel, ConfigDict, Field

###############################
## CATALOGOS SIN DEPENDENCIA
##############################


# EMPRESA-------------------------------
class EmpresaBase(BaseModel):
    nombre: str = Field(max_length=100)


class EmpresaCreate(EmpresaBase):
    pass


class EmpresaUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)


class EmpresaOut(EmpresaBase):
    id_org: int
    model_config = ConfigDict(from_attributes=True)


#CARGO-----------------------------------
class CargoBase(BaseModel):
    nombre : str = Field(max_length=100)

class CargoCreate(CargoBase):
    pass


class CargoUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)


class CargoOut(CargoBase):
    id_cargo: int
    model_config = ConfigDict(from_attributes=True)


class PlantaBase(BaseModel):
    nombre: str = Field(max_length=100)


class PlantaCreate(PlantaBase):
    pass


class PlantaUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)


class PlantaOut(PlantaBase):
    id_planta: int
    model_config = ConfigDict(from_attributes=True)


class TipoEquipoBase(BaseModel):
    nombre: str = Field(max_length=100)


class TipoEquipoCreate(TipoEquipoBase):
    pass


class TipoEquipoUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)


class TipoEquipoOut(TipoEquipoBase):
    id_tipoeq: int
    model_config = ConfigDict(from_attributes=True)


class SistemaOperativoBase(BaseModel):
    nombre: str = Field(max_length=100)


class SistemaOperativoCreate(SistemaOperativoBase):
    pass


class SistemaOperativoUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)


class SistemaOperativoOut(SistemaOperativoBase):
    id_so: int
    model_config = ConfigDict(from_attributes=True)


class TipoPerifericoBase(BaseModel):
    nombre: str = Field(max_length=100)


class TipoPerifericoCreate(TipoPerifericoBase):
    pass


class TipoPerifericoUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)


class TipoPerifericoOut(TipoPerifericoBase):
    id_tipoper: int
    model_config = ConfigDict(from_attributes=True)


class ProveedorLicenciaBase(BaseModel):
    nombre: str = Field(max_length=100)


class ProveedorLicenciaCreate(ProveedorLicenciaBase):
    pass


class ProveedorLicenciaUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)


class ProveedorLicenciaOut(ProveedorLicenciaBase):
    id_prov: int
    model_config = ConfigDict(from_attributes=True)


class ProveedorFacturaBase(BaseModel):
    nombre: str = Field(max_length=100)


class ProveedorFacturaCreate(ProveedorFacturaBase):
    pass


class ProveedorFacturaUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)


class ProveedorFacturaOut(ProveedorFacturaBase):
    id_prov_fact: int
    model_config = ConfigDict(from_attributes=True)


class MarcaBase(BaseModel):
    nombre: str = Field(max_length=100)


class MarcaCreate(MarcaBase):
    pass


class MarcaUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)


class MarcaOut(MarcaBase):
    id_marca: int
    model_config = ConfigDict(from_attributes=True)


class ModeloBase(BaseModel):
    nombre  : str = Field(max_length=100)
    id_marca: int


class ModeloCreate(ModeloBase):
    pass


class ModeloUpdate(BaseModel):
    nombre  : str | None = Field(default=None, max_length=100)
    id_marca: int | None = None


class ModeloOut(ModeloBase):
    id_modelo: int
    model_config = ConfigDict(from_attributes=True)


###############################
## CATALOGOS CON DEPENDENCIA
##############################


class SubAreaBase(BaseModel):
    nombre  : str = Field(max_length=100)
    id_dpto : int                          # FK al padre

class SubAreaCreate(SubAreaBase):
    pass


class SubAreaUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)
    id_dpto: int | None = None


class SubAreaOut(SubAreaBase):
    id_sub: int
    model_config = ConfigDict(from_attributes=True)


class VersionLicenciaBase(BaseModel):
    nombre: str = Field(max_length=100)
    id_prov: int


class VersionLicenciaCreate(VersionLicenciaBase):
    pass


class VersionLicenciaUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)
    id_prov: int | None = None


class VersionLicenciaOut(VersionLicenciaBase):
    id_ver: int
    model_config = ConfigDict(from_attributes=True)
