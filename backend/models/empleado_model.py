from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Cargo(Base):
    __tablename__ = "cargo"

    id_cargo : Mapped[int] = mapped_column(primary_key=True)
    nombre   : Mapped[str] = mapped_column(String(100))
    empleados = relationship("Empleado", back_populates="cargo")


class Planta(Base):
    __tablename__ = "planta"

    id_planta : Mapped[int] = mapped_column(primary_key=True)
    nombre    : Mapped[str] = mapped_column(String(100))
    empleados = relationship("Empleado", back_populates="planta")


class Empleado(Base):
    __tablename__ = "empleado"

    id_emp       : Mapped[int] = mapped_column(primary_key=True)
    rut          : Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    nombre       : Mapped[str] = mapped_column(String(50), nullable=False)
    email        : Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    operatividad : Mapped[bool] = mapped_column(nullable=False, default=True)

    id_cargo  : Mapped[int] = mapped_column(ForeignKey("cargo.id_cargo"))
    id_planta : Mapped[int] = mapped_column(ForeignKey("planta.id_planta"))
    id_dpto   : Mapped[int | None] = mapped_column(ForeignKey("departamento.id_dpto"))
    id_sub    : Mapped[int | None] = mapped_column(ForeignKey("sub_area.id_sub"))

    cargo       = relationship("Cargo", back_populates="empleados")
    planta      = relationship("Planta", back_populates="empleados")
    departamento = relationship("Departamento", back_populates="empleados")
    subarea     = relationship("SubArea", back_populates="empleados")


class UsuarioSistema(Base):
    __tablename__ = "usuario_sistema"

    id_emp    : Mapped[int] = mapped_column(ForeignKey("empleado.id_emp"), primary_key=True)
    hash_pass : Mapped[str] = mapped_column(String(255), nullable=False)
    rol       : Mapped[str] = mapped_column(String(50), nullable=False)
    vigente   : Mapped[bool] = mapped_column(nullable=False, default=True)
