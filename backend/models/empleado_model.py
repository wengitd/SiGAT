from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column


from database import Base


class Empleado(Base):
    __tablename__= "empleado"

    id_emp: Mapped [int] = mapped_column(primary_key=True)
    rut: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    nombre:Mapped[str] = mapped_column(String(50), nullable=False)
    email:Mapped[str] = mapped_column(String(50),nullable=False,unique=True)
    cargo: Mapped[str] = mapped_column(String(50),nullable=False)
    planta: Mapped[str] = mapped_column(String(50),nullable=False)
    operatividad: Mapped[bool] = mapped_column(nullable=False, default=True)

    id_dpto: Mapped[int|None] = mapped_column(ForeignKey("departamento.id_dpto"))


class Informatico(Base):
    __tablename__="informatico"

    id_emp      : Mapped[int] = mapped_column(ForeignKey("empleado.id_emp"), primary_key=True)
    hash_pass   : Mapped[str] = mapped_column(String(255), nullable=False)
    rol         : Mapped[str] = mapped_column(String(50), nullable=False)
    vigente     : Mapped[bool]= mapped_column(nullable=False, default=True)

