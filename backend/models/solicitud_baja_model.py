from sqlalchemy import String, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date

from database import Base


class SolicitudBaja(Base):
    __tablename__ = "solicitud_baja"

    id_solbaja       : Mapped[int] = mapped_column(primary_key=True)
    motivo_baja      : Mapped[str] = mapped_column(String(200), nullable=False)
    fecha_solicitud  : Mapped[date] = mapped_column(nullable=False, server_default=func.current_date())
    fecha_resolucion : Mapped[date | None] = mapped_column()
    ref_aprob        : Mapped[str | None] = mapped_column(String(200))
    estado_sol       : Mapped[str] = mapped_column(String(20), nullable=False, server_default="pendiente")
    ruta_acta_baja   : Mapped[str | None] = mapped_column(String(255))
    fecha_borrado    : Mapped[date | None] = mapped_column()

    id_act          : Mapped[int] = mapped_column(ForeignKey("activo_ti.id_act"), nullable=False)
    id_emp_sol      : Mapped[int] = mapped_column(ForeignKey("usuario_sistema.id_emp"), nullable=False)      # solicitante
    id_emp_aprob    : Mapped[int | None] = mapped_column(ForeignKey("usuario_sistema.id_emp"))                # jefatura aprobadora (consultor con acceso al sistema)
    id_emp_borrado  : Mapped[int | None] = mapped_column(ForeignKey("usuario_sistema.id_emp"))                # técnico responsable del borrado
