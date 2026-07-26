from pydantic import BaseModel, ConfigDict, Field, field_validator
from decimal import Decimal
from typing import Literal, Annotated, Union
from datetime import date
import re

MAC_PATTERN = re.compile(r"^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$")


def validar_fecha_no_futura(v: date | None) -> date | None:
    if v is not None and v > date.today():
        raise ValueError("La fecha no puede ser posterior a la fecha actual")
    return v


def validar_mac(v: str | None) -> str | None:
    if v is not None and not MAC_PATTERN.match(v):
        raise ValueError("La dirección MAC debe tener el formato XX:XX:XX:XX:XX:XX")
    return v.upper() if v is not None else v


class ActivoBase(BaseModel):
    id_modelo      : int | None = None
    num_serie      : str | None = None
    origen         : Literal["empresa", "personal"]
    fecha_recep    : date| None = None
    id_fact        : int | None = None
    id_tipoe       : int
    id_dispo       : int

    @field_validator("fecha_recep")
    @classmethod
    def _fecha_recep_no_futura(cls, v):
        return validar_fecha_no_futura(v)



####################################################
#####              CREATE   ########################
####################################################


class EquipoComputoCreate(ActivoBase):
    tipo            : Literal["equipo_computo"]

    ram_capac       : Literal[2, 4, 6, 8, 10, 12, 16, 20] | None = None
    ram_tipo        : Literal["DDR3", "DDR4", "DDR5"] | None = None
    cpu             : str | None= None
    mac_ethernet    : str | None= None
    mac_wifi        : str | None= None
    disco_tipo      : Literal["HDD", "SSD", "NVMe", "eMMC"] | None = None
    disco_unidad    : Literal["MB", "GB", "TB"]             | None = None
    disco_capac     : int | None= None
    host_name       : str | None= None

    id_tipoeq    : int | None = None   # FK → tipo_equipo
    id_so        : int | None = None   # FK → sistema_operativo

    @field_validator("mac_ethernet", "mac_wifi")
    @classmethod
    def _mac_valida(cls, v):
        return validar_mac(v)


class PerifericoCreate(ActivoBase):
    tipo        : Literal["periferico"]

    valor_tec  : Decimal | None = Field(default=None, max_digits=10, decimal_places=2)
    u_medida   : str | None = None
    obs_perif  : str | None = None
    id_tipoper : int | None = None     # FK → tipo_periferico


# Union discriminada por el campo "tipo"
ActivoCreate = Annotated[
    Union[EquipoComputoCreate, PerifericoCreate],
    Field(discriminator="tipo")
]

####################################################
#####              UPDATE   ########################
####################################################

# IMPORTANTE: "tipo" no se expone en el update.
# Cambiar equipo_computo ↔ periferico dejaría datos huérfanos
# en las tablas hijas y requeriría lógica especial.

class ActivoUpdate(BaseModel):
    #ActivoTI
    id_modelo       : int | None = None
    num_serie       : str | None = None
    origen          : str | None = None
    fecha_recep     : date| None = None
    id_tipoe        : int | None = None
    id_dispo        : int | None = None

    @field_validator("fecha_recep")
    @classmethod
    def _fecha_recep_no_futura(cls, v):
        return validar_fecha_no_futura(v)

    #Equipo Computo
    ram_capac       : Literal[2, 4, 6, 8, 10, 12, 16, 20] | None = None
    ram_tipo        : Literal["DDR3", "DDR4", "DDR5"] | None = None
    cpu             : str | None= None
    mac_ethernet    : str | None= None
    mac_wifi        : str | None= None
    disco_tipo      : Literal["HDD", "SSD", "NVMe", "eMMC"] | None = None
    disco_unidad    : Literal["MB", "GB", "TB"]             | None = None
    disco_capac     : int | None= None
    host_name       : str | None = None
    id_tipoeq       : int | None = None
    id_so           : int | None = None

    @field_validator("mac_ethernet", "mac_wifi")
    @classmethod
    def _mac_valida(cls, v):
        return validar_mac(v)

    #Periferico
    valor_tec       :Decimal |None = Field(default=None, max_digits=10, decimal_places=2)
    u_medida        :str | None= None
    obs_perif       :str | None= None
    id_tipoper      :int | None = None


####################################################
#####              OUT      ########################
####################################################


class ActivoOut(ActivoBase):
    id_act  : int

    tipo            : str
    ruta_pdf_fact   : str | None = None
    detalles_so     : dict | None = None
    nombre_marca    : str | None = None
    nombre_modelo   : str | None = None
    nombre_estado   : str | None = None
    nombre_tipoeq   : str | None = None
    nombre_tipoper  : str | None = None
    empleado_asignado: str | None = None
    nombre_dispo    : str  | None = None
    dispo_color     : str  | None = None
    fecha_recep     : date | None = None
    

    #Equipo Computo
    ram_capac       : Literal[2, 4, 6, 8, 10, 12, 16, 20] | None = None
    ram_tipo        : Literal["DDR3", "DDR4", "DDR5"] | None = None
    cpu             : str | None= None
    mac_ethernet    : str | None= None
    mac_wifi        : str | None= None
    disco_unidad    : Literal["MB", "GB", "TB"] | None = None
    disco_tipo      : Literal["HDD", "SSD", "NVMe", "eMMC"] | None = None
    disco_capac     : int | None= None
    host_name       : str | None= None
    id_tipoeq       : int | None= None
    id_edicion_so   : int | None= None

    #Periferico
    valor_tec       : Decimal | None = None
    u_medida        : str | None= None
    obs_perif       : str | None= None
    id_tipoper      : int | None = None
    

    model_config = ConfigDict(from_attributes=True)
