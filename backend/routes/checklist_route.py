from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy.orm import joinedload
from auth.dependencies import get_current_user, require_editor

from models.empleado_model import UsuarioSistema
from models.checklist_model import  Checklist
from schemas.checklist_schema import ChecklistCreate, ChecklistUpdate, ChecklistOut


router=APIRouter(prefix="/Checklist", tags=["Checklist"])


@router.get("/", response_model=list[ChecklistOut])
def listar (db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    "Devuelve todos los checklist."
    #return.db.query(model.py)
    return db.query(Checklist).all()



@router.get("/{id_check}", response_model=ChecklistOut)
def obtener(id_check: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve un Checklist por id."""
    checklist = (
        db.query(Checklist).options(joinedload(Checklist.check_plantillas)) .filter(Checklist.id_check == id_check).first()
    )
    if checklist is None:
        raise HTTPException(status_code=404, detail="Checklist no encontrado")    

    return checklist


@router.post("/", response_model=ChecklistOut, status_code=status.HTTP_201_CREATED)
def crear(payload: ChecklistCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):

    #para FK UsuarioSistema
    if payload.id_emp is not None:
        if db.query(UsuarioSistema).filter(UsuarioSistema.id_emp == payload.id_emp).first() is None:
            raise HTTPException(status_code=400, detail="Usuario no existe")

    nuevo_checklist = Checklist(**payload.model_dump())
    
    db.add(nuevo_checklist)
    db.commit()
    db.refresh(nuevo_checklist)
 
    return nuevo_checklist


@router.put("/{id_check}", response_model=ChecklistOut)
def actualizar(id_check: int, payload: ChecklistUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    
    act_checklist =db.query(Checklist).filter(Checklist.id_check==id_check).first()

    if act_checklist is None:
        raise HTTPException(status_code=404, detail="Checklist no encontrado")

    datos= payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
            setattr(act_checklist,campo,valor)


    db.commit()
    db.refresh(act_checklist)

    return act_checklist

