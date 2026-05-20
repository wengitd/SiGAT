from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy.orm import joinedload


from models.empleado_model import Empleado
from models.checklist_model import  Checklist
from schemas.checklist_schema import ChecklistCreate, ChecklistUpdate, ChecklistOut


router=APIRouter(prefix="/Checklist", tags=["Checklist"])


@router.get("/", response_model=list[ChecklistOut])
def listar (db: Session = Depends(get_db)):
    "Devuelve todos los checklist."
    #return.db.query(model.py)
    return db.query(Checklist).all()



@router.get("/{id_check}", response_model=ChecklistOut)
def obtener(id_check: int, db: Session = Depends(get_db)):
    """Devuelve un Checklist por id."""
    checklist = (
        db.query(Checklist).options(joinedload(Checklist.check_plantillas)) .filter(Checklist.id_check == id_check).first()
    )
    if checklist is None:
        raise HTTPException(status_code=404, detail="Checklist no encontrado")    

    return checklist


@router.post("/", response_model=ChecklistOut, status_code=status.HTTP_201_CREATED)
def crear(payload: ChecklistCreate, db: Session = Depends(get_db)):

    #para FK empleado
    if db.query(Empleado).filter(Empleado.id_emp == payload.id_emp).first() is None:
        raise HTTPException(status_code=400, detail="Empleado no existe")

    nuevo_checklist = Checklist(**payload.model_dump())
    
    db.add(nuevo_checklist)
    db.commit()
    db.refresh(nuevo_checklist)
 
    return nuevo_checklist


@router.put("/{id_check}", response_model=ChecklistOut)
def actualizar(id_check: int, payload: ChecklistUpdate, db: Session = Depends(get_db)):
    
    act_checklist =db.query(Checklist).filter(Checklist.id_check==id_check).first()

    if act_checklist is None:
        raise HTTPException(status_code=404, detail="Checklist no encontrado")

    datos= payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
            setattr(act_checklist,campo,valor)


    db.commit()
    db.refresh(act_checklist)

    return act_checklist

