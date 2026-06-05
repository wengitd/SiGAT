from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.activo_ti_model import Marca, Modelo
from schemas.catalogos_schema import MarcaCreate, MarcaUpdate, MarcaOut

router = APIRouter(prefix="/marcas", tags=["marcas"])


@router.get("/", response_model=list[MarcaOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Marca).all()


@router.get("/{id_marca}", response_model=MarcaOut)
def obtener(id_marca: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    registro = db.query(Marca).filter(Marca.id_marca == id_marca).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    return registro


@router.post("/", response_model=MarcaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: MarcaCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    nuevo = Marca(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_marca}", response_model=MarcaOut)
def actualizar(id_marca: int, payload: MarcaUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(Marca).filter(Marca.id_marca == id_marca).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Marca no encontrada")

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_marca}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_marca: int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(Marca).filter(Marca.id_marca == id_marca).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Marca no encontrada")

    if db.query(Modelo).filter(Modelo.id_marca == id_marca).first():
        raise HTTPException(status_code=400, detail="No se puede eliminar: tiene modelos asociados")

    db.delete(registro)
    db.commit()
    return None
