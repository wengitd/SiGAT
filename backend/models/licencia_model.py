from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
from datetime import date


class ProveedorLicencia(Base):
    __tablename__ = "proveedor_licencia"

    id_prov   : Mapped[int] = mapped_column(primary_key=True)
    nombre    : Mapped[str] = mapped_column(String(100))
    versiones = relationship("VersionLicencia", back_populates="proveedor")


class VersionLicencia(Base):
    __tablename__ = "version_licencia"

    id_ver  : Mapped[int] = mapped_column(primary_key=True)
    id_prov : Mapped[int] = mapped_column(ForeignKey("proveedor_licencia.id_prov"))
    nombre  : Mapped[str] = mapped_column(String(100))

    proveedor = relationship("ProveedorLicencia", back_populates="versiones")
    licencias = relationship("Licencia", back_populates="version")


class Licencia(Base):
    __tablename__ = "licencia"

    id_lic    : Mapped[int] = mapped_column(primary_key=True)
    fecha_ini : Mapped[date | None] = mapped_column()
    fecha_exp : Mapped[date | None] = mapped_column()

    id_prov : Mapped[int] = mapped_column(ForeignKey("proveedor_licencia.id_prov"))
    id_ver  : Mapped[int] = mapped_column(ForeignKey("version_licencia.id_ver"))

    proveedor = relationship("ProveedorLicencia")
    version   = relationship("VersionLicencia", back_populates="licencias")
