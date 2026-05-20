from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db


from models.checklist_model import Plantilla, Checklist
from schemas.checklist_schema import PlantillaCreate, PlantillaUpdate, PlantillaOut

router=APIRouter(prefix="/Plantilla", tags=["Plantilla"])


@router.get("/", response_model=list[PlantillaOut])
def listar (db: Session = Depends(get_db)):
    "Devuelve todas las plantillas."
    #return.db.query(model.py)
    return db.query(Plantilla).all()


@router.post("/", response_model=PlantillaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: PlantillaCreate, db: Session = Depends(get_db)):
       
    nueva_plantilla = Plantilla(**payload.model_dump())

    if db.query(Plantilla).filter(Plantilla.orden==payload.orden).first():
        raise HTTPException(status_code=400, detail="El numero de orden ya existe")

    
    db.add(nueva_plantilla)
    db.commit()
    db.refresh(nueva_plantilla)
    return nueva_plantilla


@router.put("/{id_ip}", response_model=PlantillaOut)
def actualizar(id_ip: int, payload: PlantillaUpdate, db: Session = Depends(get_db)):
    
    act_plantilla =db.query(Plantilla).filter(Plantilla.id_ip==id_ip).first()

    if act_plantilla is None:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    datos= payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
            setattr(act_plantilla,campo,valor)


    db.commit()
    db.refresh(act_plantilla)

    return act_plantilla

