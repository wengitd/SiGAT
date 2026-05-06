from sqlalchemy import String, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date
from decimal import Decimal

from database import Base

class ActivoTi (Base):
    __tablename__ ="activo_ti"

    id_act          : Mapped[int] = mapped_column(primary_key=True)
    modelo          : Mapped[str] = mapped_column(String(50))
    marca           : Mapped[str] = mapped_column(String(50))
    num_serie       : Mapped[str] = mapped_column(String(50), unique=True)
    disponibilidad  : Mapped[bool] = mapped_column(nullable=False, default=True)
    tipo            : Mapped[str] = mapped_column(String(20))
    origen          : Mapped[str] = mapped_column(String(20))

    id_fact     : Mapped[int] = mapped_column(ForeignKey("factura.id_fact"))
    id_tipoe    : Mapped[int] = mapped_column(ForeignKey("tipo_estado.id_tipoe"),nullable=False)


class EquipoComputo(Base):
    __tablename__ ="equipo_computo"

    ram_capac       : Mapped[int] = mapped_column()
    ram_tipo        : Mapped[str] = mapped_column(String(10))
    sist_op         : Mapped[str] = mapped_column(String(50))
    cpu             : Mapped[str] = mapped_column(String(50))
    mac_ethernet    : Mapped[str] = mapped_column(String(10))
    mac_wifi        : Mapped[str] = mapped_column(String(10))
    disco_un        : Mapped[str] = mapped_column(String(10))
    disco_tipo      : Mapped[str] = mapped_column(String(20))
    disco_capac     : Mapped[int] = mapped_column()
    host_name       : Mapped[str] = mapped_column(String(50))
    tipo_equipo     : Mapped[str] = mapped_column(String(50))

    id_act : Mapped[int] = mapped_column(ForeignKey("activo_ti.id_act"), primary_key=True)


class Periferico (Base):
    __tablename__="periferico"

    tipo_per    : Mapped[str]       = mapped_column(String(50))
    valor_tec   : Mapped[Decimal]   = mapped_column(Numeric(precision=10, scale=2))
    u_medida    : Mapped[str]       = mapped_column(String(50))
    obs_perif   : Mapped[str|None]  = mapped_column()

    id_act : Mapped[int] = mapped_column(ForeignKey("activo_ti.id_act"),primary_key=True)


