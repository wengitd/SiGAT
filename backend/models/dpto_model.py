from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Empresa(Base):
    __tablename__ = "empresa"

    id_org  : Mapped[int] = mapped_column(primary_key=True)
    nombre  : Mapped[str] = mapped_column(String(100))

    departamentos = relationship("Departamento", back_populates="empresa")


class Departamento(Base):
    __tablename__ = "departamento"

    id_dpto : Mapped[int] = mapped_column(primary_key=True)
    id_org  : Mapped[int] = mapped_column(ForeignKey("empresa.id_org"))
    zona    : Mapped[str | None] = mapped_column(String(50))
    nom_dpto: Mapped[str] = mapped_column(String(100))

    empresa   = relationship("Empresa", back_populates="departamentos")
    subareas  = relationship("SubArea", back_populates="departamento")
    empleados = relationship("Empleado", back_populates="departamento")


class SubArea(Base):
    __tablename__ = "sub_area"

    id_sub  : Mapped[int] = mapped_column(primary_key=True)
    id_dpto : Mapped[int] = mapped_column(ForeignKey("departamento.id_dpto"))
    nombre  : Mapped[str] = mapped_column(String(100))

    departamento = relationship("Departamento", back_populates="subareas")
    empleados    = relationship("Empleado", back_populates="subarea")
