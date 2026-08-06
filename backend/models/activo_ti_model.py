from sqlalchemy import String, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal
from datetime import date

from database import Base


class FamiliaSO(Base):
    __tablename__ = "familia_so"
    id_fam_so: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))


class VersionSO(Base):
    __tablename__ = "version_so"
    id_ver_so: Mapped[int] = mapped_column(primary_key=True)
    id_fam_so: Mapped[int] = mapped_column(ForeignKey("familia_so.id_fam_so"))
    nombre: Mapped[str] = mapped_column(String(100))


class EdicionSO(Base):
    __tablename__ = "edicion_so"
    id_edicion_so: Mapped[int] = mapped_column(primary_key=True)
    id_ver_so: Mapped[int] = mapped_column(ForeignKey("version_so.id_ver_so"))
    nombre: Mapped[str] = mapped_column(String(100))
    equipos = relationship("EquipoComputo", back_populates="edicion_so")


class TipoEquipo(Base):
    __tablename__ = "tipo_equipo"

    id_tipoeq: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    equipos = relationship("EquipoComputo", back_populates="tipo_equipo")


class TipoPeriferico(Base):
    __tablename__ = "tipo_periferico"

    id_tipoper: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    perifericos = relationship("Periferico", back_populates="tipo_periferico")


class Marca(Base):
    __tablename__ = "marca"

    id_marca: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    modelos = relationship("Modelo", back_populates="marca")


class Modelo(Base):
    __tablename__ = "modelo"

    id_modelo: Mapped[int] = mapped_column(primary_key=True)
    id_marca: Mapped[int] = mapped_column(ForeignKey("marca.id_marca"))
    nombre: Mapped[str] = mapped_column(String(100))
    marca = relationship("Marca", back_populates="modelos")


class Disponibilidad(Base):
    __tablename__ = "disponibilidad"

    id_dispo: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    descr: Mapped[str] = mapped_column(String(100))
    color: Mapped[str | None] = mapped_column(
        String(20)
    )  # ej: "success", "warning", "error", "info", "primary"


# Tabla relacional: qué disponibilidades permite cada estado
class EstadoDispo(Base):
    __tablename__ = "estado_dispo"

    id_tipoe: Mapped[int] = mapped_column(
        ForeignKey("tipo_estado.id_tipoe"), primary_key=True
    )
    id_dispo: Mapped[int] = mapped_column(
        ForeignKey("disponibilidad.id_dispo"), primary_key=True
    )


class ActivoTi(Base):
    __tablename__ = "activo_ti"

    id_act: Mapped[int] = mapped_column(primary_key=True)
    num_serie: Mapped[str | None] = mapped_column(String(50), unique=True)
    tipo: Mapped[str] = mapped_column(String(20))
    origen: Mapped[str] = mapped_column(String(20))
    fecha_recep: Mapped[date | None] = mapped_column()

    id_modelo: Mapped[int | None] = mapped_column(ForeignKey("modelo.id_modelo"))
    id_dispo: Mapped[int] = mapped_column(
        ForeignKey("disponibilidad.id_dispo"), nullable=False
    )
    id_fact: Mapped[int | None] = mapped_column(
        ForeignKey("factura.id_fact"), nullable=True
    )
    id_tipoe: Mapped[int] = mapped_column(
        ForeignKey("tipo_estado.id_tipoe"), nullable=False
    )


class EquipoComputo(Base):
    __tablename__ = "equipo_computo"

    ram_capac: Mapped[int | None] = mapped_column()
    ram_tipo: Mapped[str | None] = mapped_column(String(10))
    cpu: Mapped[str | None] = mapped_column(String(50))
    mac_ethernet: Mapped[str | None] = mapped_column(String(17))
    mac_wifi: Mapped[str | None] = mapped_column(String(17))
    disco_unidad: Mapped[str | None] = mapped_column(String(5))
    disco_tipo: Mapped[str | None] = mapped_column(String(10))
    disco_capac: Mapped[int | None] = mapped_column()
    host_name: Mapped[str | None] = mapped_column(String(50))

    id_act: Mapped[int] = mapped_column(
        ForeignKey("activo_ti.id_act"), primary_key=True
    )
    id_tipoeq: Mapped[int | None] = mapped_column(ForeignKey("tipo_equipo.id_tipoeq"))
    id_edicion_so: Mapped[int | None] = mapped_column(
        ForeignKey("edicion_so.id_edicion_so")
    )

    tipo_equipo = relationship("TipoEquipo", back_populates="equipos")
    edicion_so = relationship("EdicionSO", back_populates="equipos")


class Periferico(Base):
    __tablename__ = "periferico"

    valor_tec: Mapped[Decimal | None] = mapped_column(Numeric(precision=10, scale=2))
    u_medida: Mapped[str | None] = mapped_column(String(50))
    obs_perif: Mapped[str | None] = mapped_column()

    id_act: Mapped[int] = mapped_column(
        ForeignKey("activo_ti.id_act"), primary_key=True
    )
    id_tipoper: Mapped[int | None] = mapped_column(
        ForeignKey("tipo_periferico.id_tipoper")
    )

    tipo_periferico = relationship("TipoPeriferico", back_populates="perifericos")
