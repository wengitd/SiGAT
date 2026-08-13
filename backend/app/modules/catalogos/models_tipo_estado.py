from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TipoEstado(Base):
    __tablename__ = "tipo_estado"
    id_tipoe: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    descr: Mapped[str | None] = mapped_column()
    operatividad: Mapped[bool] = mapped_column(nullable=False, default=True)
