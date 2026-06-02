from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.empleado_model import Planta, Empleado
from schemas.catalogos_schema import PlantaCreate, PlantaUpdate, PlantaOut

router = APIRouter(prefix="/plantas", tags=["plantas"])


@router.get("/", response_model=list[PlantaOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todas las plantas."""
    return db.query(Planta).all()


@router.get("/{id_planta}", response_model=PlantaOut)
def obtener(id_planta: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve una planta por id."""
    registro = db.query(Planta).filter(Planta.id_planta == id_planta).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Planta no encontrada")
    return registro


@router.post("/", response_model=PlantaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: PlantaCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    nuevo = Planta(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_planta}", response_model=PlantaOut)
def actualizar(id_planta: int, payload: PlantaUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(Planta).filter(Planta.id_planta == id_planta).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Planta no encontrada")

    #evita el fallo cuando se mande el mismo orden que ya tiene
    if "orden" in datos and datos["orden"] != act_plantilla.orden:
        duplicado = db.query(Plantilla).filter(Plantilla.orden == datos["orden"]).first()
        if duplicado:
            raise HTTPException(status_code=400, detail="Ya existe una plantilla con ese orden")
    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_planta}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_planta: int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(Planta).filter(Planta.id_planta == id_planta).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Planta no encontrada")

    tiene_hijos = db.query(Empleado).filter(Empleado.id_planta == id_planta).first()
    if tiene_hijos:
        raise HTTPException(status_code=400, detail="No se puede eliminar: tiene registros asociados")

    db.delete(registro)
    db.commit()
    return None
