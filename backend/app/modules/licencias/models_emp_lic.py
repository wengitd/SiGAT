from datetime import date

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class EmpLic(Base):
    """Asignación de una versión de licencia (con su proveedor) a un empleado."""

    __tablename__ = "emp_lic"

    id_emp: Mapped[int] = mapped_column(ForeignKey("empleado.id_emp"), primary_key=True)
    id_ver: Mapped[int] = mapped_column(
        ForeignKey("version_licencia.id_ver"), primary_key=True
    )
    fecha_asignacion: Mapped[date] = mapped_column()
