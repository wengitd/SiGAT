from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.activo_ti_model import Marca, Modelo
from schemas.catalogos_schema import MarcaCreate, MarcaUpdate, MarcaOut

router = APIRouter(prefix="/marcas", tags=["marcas"])


def _obtener_o_crear_marca(db: Session, nombre: str) -> Marca:
    """Busca marca por nombre (sin distinguir mayúsculas) o la crea."""
    nombre = nombre.strip()
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre de la marca es obligatorio")
    marca = db.query(Marca).filter(func.lower(Marca.nombre) == nombre.lower()).first()
    if marca is None:
        marca = Marca(nombre=nombre)
        db.add(marca)
        db.flush()
    return marca


@router.get("/", response_model=list[MarcaOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Marca).all()


@router.post("/ensure", response_model=MarcaOut)
def ensure(
    payload: MarcaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Obtiene o crea una marca por nombre (idempotente)."""
    marca = _obtener_o_crear_marca(db, payload.nombre)
    db.commit()
    db.refresh(marca)
    return marca


@router.get("/{id_marca}", response_model=MarcaOut)
def obtener(
    id_marca: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    registro = db.query(Marca).filter(Marca.id_marca == id_marca).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    return registro


@router.post("/", response_model=MarcaOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: MarcaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    nuevo = Marca(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_marca}", response_model=MarcaOut)
def actualizar(
    id_marca: int,
    payload: MarcaUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    registro = db.query(Marca).filter(Marca.id_marca == id_marca).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Marca no encontrada")

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_marca}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_marca: int, db: Session = Depends(get_db), current_user=Depends(require_editor)
):
    registro = db.query(Marca).filter(Marca.id_marca == id_marca).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Marca no encontrada")

    if db.query(Modelo).filter(Modelo.id_marca == id_marca).first():
        raise HTTPException(
            status_code=400, detail="No se puede eliminar: tiene modelos asociados"
        )

    db.delete(registro)
    db.commit()
    return None
