import re
from datetime import date
from decimal import Decimal
from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAC_PATTERN = re.compile(r"^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$")

# Valores admitidos para RAM (incluye seed y hardware real)
RamCapac = Literal[2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 48, 64]
RamTipo = Literal["DDR3", "DDR4", "DDR5", "LPDDR4", "LPDDR5"]


def validar_fecha_no_futura(v: date | None) -> date | None:
    if v is not None and v > date.today():
        raise ValueError("La fecha no puede ser posterior a la fecha actual")
    return v


def validar_mac(v: str | None) -> str | None:
    if v is not None and not MAC_PATTERN.match(v):
        raise ValueError("La dirección MAC debe tener el formato XX:XX:XX:XX:XX:XX")
    return v.upper() if v is not None else v


class ActivoBase(BaseModel):
    id_modelo: int | None = None
    num_serie: str | None = None
    origen: Literal["Empresa", "Personal"]
    fecha_recep: date | None = None
    id_fact: int | None = None
    id_tipoe: int
    id_dispo: int

    @field_validator("fecha_recep")
    @classmethod
    def _fecha_recep_no_futura(cls, v):
        return validar_fecha_no_futura(v)


####################################################
#####              CREATE   ########################
####################################################


class EquipoComputoCreate(ActivoBase):
    tipo: Literal["Equipo Computo"]

    ram_capac: RamCapac | None = None
    ram_tipo: RamTipo | None = None
    cpu: str | None = None
    mac_ethernet: str | None = None
    mac_wifi: str | None = None
    disco_tipo: Literal["HDD", "SSD", "NVMe", "eMMC"] | None = None
    disco_unidad: Literal["MB", "GB", "TB"] | None = None
    disco_capac: int | None = None
    host_name: str | None = None

    id_tipoeq: int | None = None  # FK → tipo_equipo
    id_edicion_so: int | None = None  # FK → edicion_so

    @field_validator("mac_ethernet", "mac_wifi")
    @classmethod
    def _mac_valida(cls, v):
        return validar_mac(v)


class PerifericoCreate(ActivoBase):
    tipo: Literal["Periferico"]

    valor_tec: Decimal | None = Field(default=None, max_digits=10, decimal_places=2)
    u_medida: str | None = None
    obs_perif: str | None = None
    id_tipoper: int | None = None  # FK → tipo_periferico


# Union discriminada por el campo "tipo"
ActivoCreate = Annotated[
    Union[EquipoComputoCreate, PerifericoCreate], Field(discriminator="tipo")
]

####################################################
#####              UPDATE   ########################
####################################################

# IMPORTANTE: "tipo" no se expone en el update.
# Cambiar Equipo Computo ↔ Periferico dejaría datos huérfanos
# en las tablas hijas y requeriría lógica especial.


class ActivoUpdate(BaseModel):
    # ActivoTI
    id_modelo: int | None = None
    num_serie: str | None = None
    origen: Literal["Empresa", "Personal"] | None = None
    fecha_recep: date | None = None
    id_tipoe: int | None = None
    id_dispo: int | None = None
    # Motivo del cambio de condición (historial_estado); no es columna de activo_ti
    causa: str | None = Field(default=None, max_length=50)

    @field_validator("fecha_recep")
    @classmethod
    def _fecha_recep_no_futura(cls, v):
        return validar_fecha_no_futura(v)

    # Equipo Computo
    ram_capac: RamCapac | None = None
    ram_tipo: RamTipo | None = None
    cpu: str | None = None
    mac_ethernet: str | None = None
    mac_wifi: str | None = None
    disco_tipo: Literal["HDD", "SSD", "NVMe", "eMMC"] | None = None
    disco_unidad: Literal["MB", "GB", "TB"] | None = None
    disco_capac: int | None = None
    host_name: str | None = None
    id_tipoeq: int | None = None
    id_edicion_so: int | None = None

    @field_validator("mac_ethernet", "mac_wifi")
    @classmethod
    def _mac_valida(cls, v):
        return validar_mac(v)

    # Periferico
    valor_tec: Decimal | None = Field(default=None, max_digits=10, decimal_places=2)
    u_medida: str | None = None
    obs_perif: str | None = None
    id_tipoper: int | None = None


####################################################
#####              OUT      ########################
####################################################


class ActivoOut(ActivoBase):
    id_act: int

    tipo: str
    ruta_pdf_fact: str | None = None
    fecha_em_fact: date | None = None
    detalles_so: dict | None = None
    nombre_so: str | None = None
    nombre_marca: str | None = None
    nombre_modelo: str | None = None
    nombre_estado: str | None = None
    nombre_tipoeq: str | None = None
    nombre_tipoper: str | None = None
    empleado_asignado: str | None = None
    id_asig_actual: int | None = None
    tiene_acta_entr: bool = False
    nombre_dispo: str | None = None
    dispo_color: str | None = None
    fecha_recep: date | None = None
    # True si no tiene historial/asociaciones y puede hard-deletearse
    puede_eliminar: bool = False

    # Equipo Computo
    ram_capac: RamCapac | None = None
    ram_tipo: RamTipo | None = None
    cpu: str | None = None
    mac_ethernet: str | None = None
    mac_wifi: str | None = None
    disco_unidad: Literal["MB", "GB", "TB"] | None = None
    disco_tipo: Literal["HDD", "SSD", "NVMe", "eMMC"] | None = None
    disco_capac: int | None = None
    host_name: str | None = None
    id_tipoeq: int | None = None
    id_edicion_so: int | None = None

    # Periferico
    valor_tec: Decimal | None = None
    u_medida: str | None = None
    obs_perif: str | None = None
    id_tipoper: int | None = None

    model_config = ConfigDict(from_attributes=True)
