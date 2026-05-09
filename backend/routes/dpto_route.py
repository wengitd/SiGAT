from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.dpto_model import Departamento
from schemas.dpto_schema import DepartamentoCreate, DepartamentoUpdate, DepartamentoOut

router=APIRouter(prefix="/departamento", tags=["departamento"])

@router.get("/", response_model=list[DepartamentoOut])
def listar (db: Session = Depends(get_db)):
    "Devuelve todos los departamentos."
    #return.db.query(model.py)
    return db.query(Departamento).all()

@router.get("/{id_dpto}", response_model=DepartamentoOut)
def obtener (id_dpto: int, db: Session = Depends(get_db)):
    """Devuelve un departamento por id."""
    
    dptos = db.query(Departamento).filter(Departamento.id_dpto == id_dpto).first()
    if dptos is None:
        return  HTTPException(status_code=404, detail="Departamento no encontrado")
    return dptos

@router.post("/", response_model=DepartamentoOut, status_code=status.HTTP_201_CREATED)
def crear(payload: DepartamentoCreate, db: Session = Depends(get_db)):
    #variable=model.py(**play.model_dump())
    nuevo_dptos = Departamento(**payload.model_dump())
    db.add(nuevo_dptos)
    db.commit()
    db.refresh(nuevo_dptos)
    return nuevo_dptos

@router.put("/{id_dpto}", response_model=DepartamentoOut)
def actualizar(id_dpto:int, payload: DepartamentoUpdate, db: Session = Depends(get_db)):
    #variable=db.query(model.py).filter(model.id_model==id_model).first()
    act_dpto= db.query(Departamento).filter(Departamento.id_dpto == id_dpto).first()

    if act_dpto is None:
        raise HTTPException(status_code=404, detail="No encontrado")

    datos= payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(act_dpto,campo,valor)
    
    db.commit()
    db.refresh(act_dpto)
    return act_dpto

#los departamentos son entidades estables, no se eliminan
#se crea el endpoint en base a un atributo de operatividad, pero no está en ER, schema, ni init, 
#ni agregado al modelo.py 
#si se agrega el endpoint, Resetear la BD: DROP SCHEMA public CASCADE; CREATE SCHEMA public; 
#en pgAdmin y volver a correr init.sql.
"""
@router.delete ("/{id_dpto}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_dpto:int, db: Session = Depends(get_db)):
    eli_dpto= db.query(Departamento).filter(Departamento.id_dpto == id_dpto).first()
    
    if eli_dpto is None:
        HTTPException(status_code=404, detail="Departamento no encontrado")

    eli_dpto.operatividad=False
    db.commit()

    return None
"""