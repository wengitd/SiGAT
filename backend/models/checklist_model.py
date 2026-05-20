from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date


from database import Base

class Plantilla(Base):
    __tablename__ = "plantilla"

    id_ip:Mapped[int] = mapped_column(primary_key=True) 
    descr:Mapped[str | None] = mapped_column()
    orden:Mapped[int] = mapped_column(nullable=False)   

    # relación inversa
    check_plantillas = relationship("CheckPlantilla", back_populates="plantilla")    

         

class Checklist (Base):
    __tablename__ ="checklist"

    id_check    : Mapped[int]=mapped_column(primary_key=True)
    nombre      : Mapped[str]=mapped_column(String(50),nullable=False)
    fecha_ini   : Mapped[date]=mapped_column()
    fecha_ter   : Mapped[date]=mapped_column()

    id_emp      :Mapped[int]= mapped_column(ForeignKey("informatico.id_emp"))

    #relacion inversa
    check_plantillas = relationship("CheckPlantilla", back_populates="checklist")
  

class CheckPlantilla(Base):
    __tablename__ = "check_plantilla"
    
    estado      : Mapped[str] = mapped_column(String(50),nullable=False)
    observacion : Mapped[str|None] = mapped_column(String(255))

    id_check    : Mapped[int] = mapped_column(ForeignKey("checklist.id_check"),primary_key=True)
    id_ip       : Mapped[int] = mapped_column(ForeignKey("plantilla.id_ip"),primary_key=True)

    #para anidar datos
    checklist = relationship("Checklist", back_populates="check_plantillas")
    plantilla = relationship("Plantilla", back_populates="check_plantillas")
