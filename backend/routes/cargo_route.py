from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.empleado_model import Cargo, Empleado
from schemas.catalogos_schema import CargoCreate, CargoUpdate, CargoOut

router = APIRouter(prefix="/cargos", tags=["cargos"])


@router.get("/", response_model=list[CargoOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todos los cargos."""
    return db.query(Cargo).all()


@router.get("/{id_cargo}", response_model=CargoOut)
def obtener(id_cargo: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve un cargo por id."""
    registro = db.query(Cargo).filter(Cargo.id_cargo == id_cargo).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Cargo no encontrado")
    return registro


@router.post("/", response_model=CargoOut, status_code=status.HTTP_201_CREATED)
def crear(payload: CargoCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    nuevo = Cargo(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_cargo}", response_model=CargoOut)
def actualizar(id_cargo: int, payload: CargoUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(Cargo).filter(Cargo.id_cargo == id_cargo).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Cargo no encontrado")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_cargo}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_cargo: int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(Cargo).filter(Cargo.id_cargo == id_cargo).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Cargo no encontrado")

    tiene_hijos = db.query(Empleado).filter(Empleado.id_cargo == id_cargo).first()
    if tiene_hijos:
        raise HTTPException(status_code=400, detail="No se puede eliminar: tiene registros asociados")

    db.delete(registro)
    db.commit()
    return None
