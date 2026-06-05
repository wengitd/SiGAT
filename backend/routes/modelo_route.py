from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.activo_ti_model import Marca, Modelo
from schemas.catalogos_schema import ModeloCreate, ModeloUpdate, ModeloOut

router = APIRouter(prefix="/modelos", tags=["modelos"])


@router.get("/", response_model=list[ModeloOut])
def listar(id_marca: int | None = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(Modelo)
    if id_marca:
        query = query.filter(Modelo.id_marca == id_marca)
    return query.all()


@router.get("/{id_modelo}", response_model=ModeloOut)
def obtener(id_modelo: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    registro = db.query(Modelo).filter(Modelo.id_modelo == id_modelo).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Modelo no encontrado")
    return registro


@router.post("/", response_model=ModeloOut, status_code=status.HTTP_201_CREATED)
def crear(payload: ModeloCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    if db.query(Marca).filter(Marca.id_marca == payload.id_marca).first() is None:
        raise HTTPException(status_code=400, detail="Marca no existe")
    nuevo = Modelo(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_modelo}", response_model=ModeloOut)
def actualizar(id_modelo: int, payload: ModeloUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(Modelo).filter(Modelo.id_modelo == id_modelo).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Modelo no encontrado")

    datos = payload.model_dump(exclude_unset=True)
    if "id_marca" in datos and db.query(Marca).filter(Marca.id_marca == datos["id_marca"]).first() is None:
        raise HTTPException(status_code=400, detail="Marca no existe")

    for campo, valor in datos.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_modelo}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_modelo: int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(Modelo).filter(Modelo.id_modelo == id_modelo).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Modelo no encontrado")

    db.delete(registro)
    db.commit()
    return None
