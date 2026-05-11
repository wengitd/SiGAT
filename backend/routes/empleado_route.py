from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.empleado_model import Empleado
from schemas.empleado_schema import EmpleadoCreate, EmpleadoUpdate, EmpleadoOut
from models.dpto_model import Departamento

router=APIRouter(prefix="/empleado", tags=["Empleado"])

@router.get("/", response_model=list[EmpleadoOut])
def listar (db: Session = Depends(get_db)):
    "Devuelve todos los Empleados."
    #return.db.query(model.py)
    return db.query(Empleado).all()


@router.get("/{id_emp}", response_model=EmpleadoOut)
def obtener (id_emp: int, db: Session = Depends(get_db)):
    """Devuelve un Empleado por id."""
    
    #variable = db.query(model).filter(model.id == id).first()
    emp = db.query(Empleado).filter(Empleado.id_emp == id_emp).first()
    if emp is None:
        raise  HTTPException(status_code=404, detail="Empleado no encontrado")
    return emp

@router.post("/", response_model=EmpleadoOut, status_code=status.HTTP_201_CREATED)
def crear(payload: EmpleadoCreate, db: Session = Depends(get_db)):
     
     # para las FK
     # Validar que el departamento existe
    if payload.id_dpto is not None:
        dpto = db.query(Departamento).filter(Departamento.id_dpto == payload.id_dpto).first()
        if dpto is None:
            raise HTTPException(status_code=400, detail="Departamento no existe")
    

    #crear el objeto SQLAlchemy     
    #variable=model(**play.model_dump())
    nuevo_emp = Empleado(**payload.model_dump())
    
    #guarda
    db.add(nuevo_emp)
    db.commit()
    db.refresh(nuevo_emp)
    return nuevo_emp

@router.put("/{id_emp}", response_model=EmpleadoOut)
def actualizar(id_emp:int, payload: EmpleadoUpdate, db: Session = Depends(get_db)):
    #variable=db.query(model.py).filter(model.id_model==id_model).first()
    act_emp = db.query(Empleado).filter(Empleado.id_emp == id_emp).first()

    if act_emp is None:
        raise HTTPException(status_code=404, detail="No encontrado")

    datos= payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(act_emp,campo,valor)
    
    db.commit()
    db.refresh(act_emp)
    return act_emp

@router.delete ("/{id_emp}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_emp:int, db: Session = Depends(get_db)):
    eli_emp= db.query(Empleado).filter(Empleado.id_emp == id_emp).first()
    
    if eli_emp is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    eli_emp.operatividad=False
    db.commit()

    return None