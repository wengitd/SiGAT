from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProveedorLicencia(Base):
    __tablename__ = "proveedor_licencia"

    id_prov: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    versiones = relationship("VersionLicencia", back_populates="proveedor")


class VersionLicencia(Base):
    """Mapeo proveedor–versión que se asigna a empleados vía emp_lic."""

    __tablename__ = "version_licencia"

    id_ver: Mapped[int] = mapped_column(primary_key=True)
    id_prov: Mapped[int] = mapped_column(ForeignKey("proveedor_licencia.id_prov"))
    nombre: Mapped[str] = mapped_column(String(100))

    proveedor = relationship("ProveedorLicencia", back_populates="versiones")
