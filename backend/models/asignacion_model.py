from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date

from database import Base


class Asignacion(Base):
    __tablename__ = "asignacion"

    id_asig: Mapped[int] = mapped_column(primary_key=True)
    fecha_entr: Mapped[date] = mapped_column()
    fecha_dev: Mapped[date | None] = mapped_column()
    ruta_acta_entr: Mapped[str | None] = mapped_column(String(255))

    id_act: Mapped[int] = mapped_column(ForeignKey("activo_ti.id_act"), nullable=False)
    id_emp: Mapped[int] = mapped_column(ForeignKey("empleado.id_emp"), nullable=False)
    id_usuario_reg: Mapped[int | None] = mapped_column(
        ForeignKey("usuario_sistema.id_usuario")
    )
