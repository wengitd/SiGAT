from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
from datetime import date

class Licencia(Base):
    __tablename__ = "licencia"

    id_lic   : Mapped[int]  = mapped_column(primary_key=True)
    fecha_ini: Mapped[date|None] = mapped_column()
    fecha_exp: Mapped[date|None] = mapped_column()
    proveedor: Mapped[str]  = mapped_column(String(50), nullable=False)
    ver_licen: Mapped[str]  = mapped_column(String(50), nullable=False)
