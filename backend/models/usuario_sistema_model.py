from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class UsuarioSistema(Base):
    __tablename__ = "usuario_sistema"

    id_usuario: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    hash_pass: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[str] = mapped_column(String(20), nullable=False)
    vigente: Mapped[bool] = mapped_column(nullable=False, default=True)
