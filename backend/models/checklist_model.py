from datetime import date

from sqlalchemy import String, ForeignKey, Boolean, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Plantilla(Base):
    """Cabecera de plantilla tipada (preparación / reasignación)."""

    __tablename__ = "plantilla"

    id_plantilla: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    proposito: Mapped[str] = mapped_column(String(50), nullable=False)
    vigente: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    pasos = relationship(
        "PlantillaPaso",
        back_populates="plantilla",
        cascade="all, delete-orphan",
        order_by="PlantillaPaso.orden",
    )


class PlantillaPaso(Base):
    """Paso reutilizable perteneciente a una plantilla."""

    __tablename__ = "plantilla_paso"

    id_paso: Mapped[int] = mapped_column(primary_key=True)
    id_plantilla: Mapped[int] = mapped_column(
        ForeignKey("plantilla.id_plantilla", ondelete="CASCADE"), nullable=False
    )
    descr: Mapped[str] = mapped_column(Text, nullable=False)
    orden: Mapped[int] = mapped_column(Integer, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    plantilla = relationship("Plantilla", back_populates="pasos")


class Checklist(Base):
    """Ejecución concreta de un checklist ligada a un activo."""

    __tablename__ = "checklist"

    id_check: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    fecha_ini: Mapped[date | None] = mapped_column()
    fecha_ter: Mapped[date | None] = mapped_column()
    proposito: Mapped[str] = mapped_column(String(50), nullable=False)
    estado: Mapped[str] = mapped_column(String(50), nullable=False)
    id_usuario: Mapped[int | None] = mapped_column(ForeignKey("usuario_sistema.id_usuario"))
    id_act: Mapped[int] = mapped_column(ForeignKey("activo_ti.id_act"), nullable=False)
    id_asig: Mapped[int | None] = mapped_column(ForeignKey("asignacion.id_asig"))
    id_plantilla: Mapped[int | None] = mapped_column(ForeignKey("plantilla.id_plantilla"))

    pasos = relationship(
        "ChecklistPaso",
        back_populates="checklist",
        cascade="all, delete-orphan",
        order_by="ChecklistPaso.orden",
    )
    plantilla = relationship("Plantilla")


class ChecklistPaso(Base):
    """Paso de una ejecución con snapshot de descripción y estado."""

    __tablename__ = "checklist_paso"

    id_cpaso: Mapped[int] = mapped_column(primary_key=True)
    id_check: Mapped[int] = mapped_column(
        ForeignKey("checklist.id_check", ondelete="CASCADE"), nullable=False
    )
    id_paso: Mapped[int | None] = mapped_column(
        ForeignKey("plantilla_paso.id_paso", ondelete="SET NULL")
    )
    orden: Mapped[int] = mapped_column(Integer, nullable=False)
    descr: Mapped[str] = mapped_column(Text, nullable=False)
    estado: Mapped[str] = mapped_column(String(50), nullable=False)
    observacion: Mapped[str | None] = mapped_column(String(255))

    checklist = relationship("Checklist", back_populates="pasos")
