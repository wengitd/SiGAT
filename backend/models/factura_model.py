from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
from datetime import date


class ProveedorFactura(Base):
    __tablename__ = "proveedor_factura"

    id_prov_fact: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    facturas = relationship("Factura", back_populates="proveedor")


# -----------------------------------------------------------------------------


class Factura(Base):
    __tablename__ = "factura"

    id_fact: Mapped[int] = mapped_column(primary_key=True)
    fecha_em: Mapped[date | None] = mapped_column()
    num_folio: Mapped[int] = mapped_column(nullable=False, unique=True)
    ruta_pdf_fact: Mapped[str] = mapped_column(String(200), nullable=False)

    id_prov_fact: Mapped[int] = mapped_column(
        ForeignKey("proveedor_factura.id_prov_fact")
    )
    proveedor = relationship("ProveedorFactura", back_populates="facturas")
