from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy.orm import joinedload
from auth.dependencies import get_current_user, require_editor

from models.checklist_model import CheckPlantilla, Checklist, Plantilla
from schemas.checklist_schema import CheckPlantillaCreate, CheckPlantillaUpdate, CheckPlantillaOut

router=APIRouter(prefix="/check-plantillas", tags=["Check Plantillas"])

@router.get("/", response_model=list[CheckPlantillaOut])
def listar (db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    "Devuelve todos los checklist de las plantillas."
    #return.db.query(model.py)
    return db.query(CheckPlantilla).all()

@router.get("/{id_check}/{id_ip}", response_model=CheckPlantillaOut)
def obtener(id_check: int, id_ip:int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve un Checklist de plantillas por id."""
    obt_checkplantilla=( db.query(CheckPlantilla).options(
            joinedload(CheckPlantilla.checklist),
            joinedload(CheckPlantilla.plantilla)
        )
        .filter(
            CheckPlantilla.id_check == id_check,
            CheckPlantilla.id_ip == id_ip
        )
        .first()
    )
    if obt_checkplantilla is None:
        raise HTTPException(status_code=404, detail="no encontrado")    

    return obt_checkplantilla


@router.post("/", response_model=CheckPlantillaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: CheckPlantillaCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    
    # Validar que el checklist  existe
    if db.query(Checklist).filter(Checklist.id_check == payload.id_check).first() is None:
        raise HTTPException(status_code=400, detail="Checklist no existe")
    
    # Validar que la plantilla existe
    if db.query(Plantilla).filter(Plantilla.id_ip == payload.id_ip).first() is None:
        raise HTTPException(status_code=400, detail="Plantilla no existe")
    

    # Verificar duplicado
    duplicado = db.query(CheckPlantilla).filter(
        CheckPlantilla.id_check == payload.id_check,
        CheckPlantilla.id_ip == payload.id_ip
    ).first()
    if duplicado is not None:
        raise HTTPException(status_code=400, detail="Este ítem ya está en el checklist")


    # Crear y guardar
    nuevo_checkplantilla = CheckPlantilla(**payload.model_dump())
    db.add(nuevo_checkplantilla)
    db.commit()
    db.refresh(nuevo_checkplantilla)
    return nuevo_checkplantilla




@router.put("/{id_check}/{id_ip}", response_model=CheckPlantillaOut)
def actualizar(id_check: int, id_ip: int, payload: CheckPlantillaUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    act_checkplantilla= db.query(CheckPlantilla).filter(
        CheckPlantilla.id_check == id_check,
        CheckPlantilla.id_ip == id_ip
    ).first()

    if act_checkplantilla is None:
        raise HTTPException(status_code=404, detail="No encontrado")
    
    datos= payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(act_checkplantilla,campo,valor)
    
    db.commit()
    db.refresh(act_checkplantilla)

    return act_checkplantilla

##Delete no se usa porque rompe la trazabilidad. SI un item esta mal, se actualiza el estado

#@router.delete("/{id_check}/{id_ip}", status_code=status.HTTP_204_NO_CONTENT)
#def eliminar(id_check: int, id_ip: int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
#    """Para eliminar necesitamos los DOS ids porque la PK es compuesta."""
#    eli_check = db.query(CheckPlantilla).filter(
#        CheckPlantilla.id_check == id_check,
#        CheckPlantilla.id_ip == id_ip
#    ).first()
    
#    if eli_check is None:
#        raise HTTPException(status_code=404, detail="No encontrada")

#    db.delete(eli_check)
#    db.commit()
#    return None
