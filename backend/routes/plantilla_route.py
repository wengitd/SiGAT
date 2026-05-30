from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user, require_editor


from models.checklist_model import Plantilla, Checklist
from schemas.checklist_schema import PlantillaCreate, PlantillaUpdate, PlantillaOut

router=APIRouter(prefix="/Plantilla", tags=["Plantilla"])


@router.get("/", response_model=list[PlantillaOut])
def listar (db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    "Devuelve todas las plantillas."
    #return.db.query(model.py)
    return db.query(Plantilla).all()


@router.post("/", response_model=PlantillaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: PlantillaCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):

    if db.query(Plantilla).filter(Plantilla.orden==payload.orden).first():
        raise HTTPException(status_code=400, detail="El numero de orden ya existe")
    nueva_plantilla = Plantilla(**payload.model_dump()) 
    
    db.add(nueva_plantilla)
    db.commit()
    db.refresh(nueva_plantilla)
    return nueva_plantilla


@router.put("/{id_ip}", response_model=PlantillaOut)
def actualizar(id_ip: int, payload: PlantillaUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    
    act_plantilla =db.query(Plantilla).filter(Plantilla.id_ip==id_ip).first()

    if "orden" in datos and datos["orden"] != act_plantilla.orden:
        duplicado = db.query(Plantilla).filter(Plantilla.orden == datos["orden"]).first()
        if duplicado:
            raise HTTPException(status_code=400, detail="Ya existe una plantilla con ese orden")

    if act_plantilla is None:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    datos= payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
            setattr(act_plantilla,campo,valor)


    db.commit()
    db.refresh(act_plantilla)

    return act_plantilla

