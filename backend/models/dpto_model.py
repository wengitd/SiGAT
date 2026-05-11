from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Departamento(Base):
    __tablename__ = "departamento"

    id_dpto : Mapped[int] = mapped_column(primary_key=True)
    empresa : Mapped[str] = mapped_column(String(50), nullable=False)
    zona    : Mapped[str] = mapped_column(String(50))
    subarea : Mapped[str] = mapped_column(String(50))
    nom_dpto: Mapped[str] = mapped_column(String(50))

