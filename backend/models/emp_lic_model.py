from datetime import date

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class EmpLic(Base):
    __tablename__ = "emp_lic"

    id_emp: Mapped[int] = mapped_column(ForeignKey("empleado.id_emp"), primary_key=True)
    id_lic: Mapped[int] = mapped_column(ForeignKey("licencia.id_lic"), primary_key=True)
    fecha_asignacion: Mapped[date] = mapped_column()
