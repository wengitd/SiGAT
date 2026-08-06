from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
from datetime import date


class Factura(Base):
    __tablename__ = "factura"

    id_fact: Mapped[int] = mapped_column(primary_key=True)
    fecha_em: Mapped[date | None] = mapped_column()
    ruta_pdf_fact: Mapped[str] = mapped_column(String(200), nullable=False)
