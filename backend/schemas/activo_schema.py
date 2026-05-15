from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal
from typing import Literal,Annotated, Union #para el check constraint


class ActivoBase(BaseModel):
    modelo          : str 
    marca           : str 
    num_serie       : str 
    disponibilidad  : bool
    origen          : Literal["empresa", "personal"]
    id_fact         : int 
    id_tipoe        : int 



####################################################
#####              CREATE   ########################
####################################################

#class ActivoCreate(ActivoBase):

class EquipoComputoCreate(ActivoBase):
    tipo            : Literal["equipo_computo"]
    ram_capac       : int | None= None
    ram_tipo        : str | None= None
    sist_op         : str | None= None
    cpu             : str | None= None
    mac_ethernet    : str | None= None
    mac_wifi        : str | None= None
    disco_un        : str | None= None
    disco_tipo      : str | None= None
    disco_capac     : int | None= None
    host_name       : str | None= None
    tipo_equipo     : str | None= None

class PerifericoCreate(ActivoBase):
    tipo        : Literal["periferico"]
    tipo_per    : str | None = None
    valor_tec   : Decimal | None = None
    u_medida    : str | None = None
    obs_perif   : str | None = None

#union discriminada

ActivoCreate = Annotated[
    Union[
        EquipoComputoCreate,
        PerifericoCreate
    ],    
    Field(discriminator="tipo")
]

####################################################
#####              UPDATE   ########################
####################################################
class ActivoUpdate(BaseModel):
    modelo          : str | None = None
    marca           : str | None = None
    num_serie       : str | None = None
    disponibilidad  : bool| None = None
    #tipo            : str | None = None  no debe modificarse el tipo, sino quedan datos huerfanos
    origen          : str | None = None

#class EquipoComputoUpdate(BaseModel):
    ram_capac       : int | None= None
    ram_tipo        : str | None= None
    sist_op         : str | None= None
    cpu             : str | None= None
    mac_ethernet    : str | None= None
    mac_wifi        : str | None= None
    disco_un        : str | None= None
    disco_tipo      : str | None= None
    disco_capac     : int | None= None
    host_name       : str | None= None
    tipo_equipo     : str | None= None

#class PerifericoUpdate(BaseModel):
    tipo_per        :str | None= None
    valor_tec       :Decimal |None = Field(default=None, max_digits=10, decimal_places=2) 
    u_medida        :str | None= None
    obs_perif       :str | None= None


####################################################
#####              OUT      ########################
####################################################


class ActivoOut(ActivoBase):
    id_act  : int

    modelo          : str | None = None
    marca           : str | None = None
    num_serie       : str | None = None
    disponibilidad  : bool| None = None
    tipo            : str | None = None
    origen          : str | None = None
    id_fact         : int | None= None
    id_tipoe        : int | None= None

#class EquipoComputoOut(BaseModel):
    ram_capac       : int | None= None
    ram_tipo        : str | None= None
    sist_op         : str | None= None
    cpu             : str | None= None
    mac_ethernet    : str | None= None
    mac_wifi        : str | None= None
    disco_un        : str | None= None
    disco_tipo      : str | None= None
    disco_capac     : int | None= None
    host_name       : str | None= None
    tipo_equipo     : str | None= None

#class PerifericoOut(BaseModel):
    tipo_per        :str | None= None
    valor_tec       :Decimal |None = Field(default=None, max_digits=10, decimal_places=2) 
    u_medida        :str | None= None
    obs_perif       :str | None= None


    model_config = ConfigDict(from_attributes=True)


