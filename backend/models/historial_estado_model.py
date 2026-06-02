from sqlalchemy import String, ForeignKey,func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from database import Base

class HistorialEstado(Base):
    __tablename__ = "historial_estado"

    id_hes      :Mapped[int] = mapped_column(primary_key=True)
    fecha_reg   :Mapped[datetime] = mapped_column(nullable=False,server_default=func.current_timestamp())
    descr       :Mapped[str|None] = mapped_column()
    causa       :Mapped[str] = mapped_column(String(50), nullable=False)

    id_tipoe    : Mapped[int] = mapped_column(ForeignKey("tipo_estado.id_tipoe"), nullable=False)
    id_act      : Mapped[int] = mapped_column(ForeignKey("activo_ti.id_act"), nullable=False)
    id_emp_reg  : Mapped[int | None] = mapped_column(ForeignKey("informatico.id_emp"))

