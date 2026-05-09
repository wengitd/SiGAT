from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
from datetime import date



class Factura(Base):
    __tablename__ = "factura"

    id_fact         : Mapped[int] =mapped_column(primary_key=True)
    prov_fact       : Mapped[str]= mapped_column(String(50),nullable=False)
    fecha_em        : Mapped[date | None]= mapped_column()
    num_folio       : Mapped[int] = mapped_column(nullable=False, unique=True)
    ruta_pdf_fact   : Mapped[str]= mapped_column(String(200), nullable=False)

