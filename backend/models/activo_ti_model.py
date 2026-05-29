from sqlalchemy import String, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal

from database import Base


class SistemaOperativo(Base):
    __tablename__ = "sistema_operativo"

    id_so   : Mapped[int] = mapped_column(primary_key=True)
    nombre  : Mapped[str] = mapped_column(String(100))
    equipos = relationship("EquipoComputo", back_populates="sistema_operativo")


class TipoEquipo(Base):
    __tablename__ = "tipo_equipo"

    id_tipoeq : Mapped[int] = mapped_column(primary_key=True)
    nombre    : Mapped[str] = mapped_column(String(100))
    equipos   = relationship("EquipoComputo", back_populates="tipo_equipo")


class TipoPeriferico(Base):
    __tablename__ = "tipo_periferico"

    id_tipoper  : Mapped[int] = mapped_column(primary_key=True)
    nombre      : Mapped[str] = mapped_column(String(100))
    perifericos = relationship("Periferico", back_populates="tipo_periferico")


class ActivoTi(Base):
    __tablename__ = "activo_ti"

    id_act         : Mapped[int] = mapped_column(primary_key=True)
    modelo         : Mapped[str | None] = mapped_column(String(50))
    marca          : Mapped[str | None] = mapped_column(String(50))
    num_serie      : Mapped[str | None] = mapped_column(String(50), unique=True)
    disponibilidad : Mapped[bool] = mapped_column(nullable=False, default=True)
    tipo           : Mapped[str] = mapped_column(String(20))
    origen         : Mapped[str] = mapped_column(String(20))

    id_fact  : Mapped[int] = mapped_column(ForeignKey("factura.id_fact"))
    id_tipoe : Mapped[int] = mapped_column(ForeignKey("tipo_estado.id_tipoe"), nullable=False)


class EquipoComputo(Base):
    __tablename__ = "equipo_computo"

    ram_capac    : Mapped[int | None] = mapped_column()
    ram_tipo     : Mapped[str | None] = mapped_column(String(10))
    cpu          : Mapped[str | None] = mapped_column(String(50))
    mac_ethernet : Mapped[str | None] = mapped_column(String(17))
    mac_wifi     : Mapped[str | None] = mapped_column(String(17))
    disco_unidad : Mapped[str | None] = mapped_column(String(5))
    disco_tipo   : Mapped[str | None] = mapped_column(String(10))
    disco_capac  : Mapped[int | None] = mapped_column()
    host_name    : Mapped[str | None] = mapped_column(String(50))

    id_act    : Mapped[int] = mapped_column(ForeignKey("activo_ti.id_act"), primary_key=True)
    id_tipoeq : Mapped[int | None] = mapped_column(ForeignKey("tipo_equipo.id_tipoeq"))
    id_so     : Mapped[int | None] = mapped_column(ForeignKey("sistema_operativo.id_so"))

    tipo_equipo       = relationship("TipoEquipo", back_populates="equipos")
    sistema_operativo = relationship("SistemaOperativo", back_populates="equipos")


class Periferico(Base):
    __tablename__ = "periferico"

    valor_tec : Mapped[Decimal | None] = mapped_column(Numeric(precision=10, scale=2))
    u_medida  : Mapped[str | None] = mapped_column(String(50))
    obs_perif : Mapped[str | None] = mapped_column()

    id_act     : Mapped[int] = mapped_column(ForeignKey("activo_ti.id_act"), primary_key=True)
    id_tipoper : Mapped[int | None] = mapped_column(ForeignKey("tipo_periferico.id_tipoper"))

    tipo_periferico = relationship("TipoPeriferico", back_populates="perifericos")
