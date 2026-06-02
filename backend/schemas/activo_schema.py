from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal
from typing import Literal, Annotated, Union


class ActivoBase(BaseModel):
    modelo         : str | None = None
    marca          : str | None = None
    num_serie      : str | None = None
    disponibilidad : bool = True
    origen         : Literal["empresa", "personal"]
    id_fact        : int
    id_tipoe       : int



####################################################
#####              CREATE   ########################
####################################################


class EquipoComputoCreate(ActivoBase):
    tipo            : Literal["equipo_computo"]

    ram_capac       : int | None= None
    ram_tipo        : str | None= None
    cpu             : str | None= None
    mac_ethernet    : str | None= None
    mac_wifi        : str | None= None
    disco_tipo      : Literal["HDD", "SSD", "NVMe", "eMMC"] | None = None
    disco_unidad    : Literal["MB", "GB", "TB"]             | None = None
    disco_capac     : int | None= None
    host_name       : str | None= None

    id_tipoeq    : int | None = None   # FK → tipo_equipo
    id_so        : int | None = None   # FK → sistema_operativo


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
    modelo          : str | None = None
    marca           : str | None = None
    num_serie       : str | None = None
    disponibilidad  : bool| None = None
    origen          : str | None = None
    id_tipoe        : int | None = None

    #Equipo Computo
    ram_capac       : int | None= None
    ram_tipo        : str | None= None
    cpu             : str | None= None
    mac_ethernet    : str | None= None
    mac_wifi        : str | None= None
    disco_tipo      : Literal["HDD", "SSD", "NVMe", "eMMC"] | None = None
    disco_unidad    : Literal["MB", "GB", "TB"]             | None = None
    disco_capac     : int | None= None
    host_name       : str | None = None
    id_tipoeq       : int | None = None
    id_so           : int | None = None

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

    #Equipo Computo
    ram_capac       : int | None= None
    ram_tipo        : str | None= None
    cpu             : str | None= None
    mac_ethernet    : str | None= None
    mac_wifi        : str | None= None
    disco_unidad    : Literal["MB", "GB", "TB"] | None = None
    disco_tipo      : Literal["HDD", "SSD", "NVMe", "eMMC"] | None = None
    disco_capac     : int | None= None
    host_name       : str | None= None
    id_tipoeq       : int | None= None
    id_so           : int | None= None

    #Periferico
    valor_tec       : Decimal | None = None
    u_medida        : str | None= None
    obs_perif       : str | None= None
    id_tipoper      : int | None = None

    model_config = ConfigDict(from_attributes=True)
