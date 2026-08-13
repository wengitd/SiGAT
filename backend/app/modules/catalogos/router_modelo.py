from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.activos.models import Marca, Modelo
from app.modules.auth.dependencies import get_current_user, require_editor
from app.modules.catalogos.schemas import ModeloCreate, ModeloOut, ModeloUpdate

router = APIRouter(prefix="/modelos", tags=["modelos"])


def _obtener_o_crear_modelo(db: Session, nombre: str, id_marca: int) -> Modelo:
    """Busca modelo por marca + nombre (sin distinguir mayúsculas) o lo crea."""
    nombre = nombre.strip()
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre del modelo es obligatorio")
    if db.query(Marca).filter(Marca.id_marca == id_marca).first() is None:
        raise HTTPException(status_code=400, detail="Marca no existe")
    modelo = (
        db.query(Modelo)
        .filter(
            Modelo.id_marca == id_marca,
            func.lower(Modelo.nombre) == nombre.lower(),
        )
        .first()
    )
    if modelo is None:
        modelo = Modelo(nombre=nombre, id_marca=id_marca)
        db.add(modelo)
        db.flush()
    return modelo


@router.get("/", response_model=list[ModeloOut])
def listar(
    id_marca: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Modelo)
    if id_marca:
        query = query.filter(Modelo.id_marca == id_marca)
    return query.all()


@router.post("/ensure", response_model=ModeloOut)
def ensure(
    payload: ModeloCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Obtiene o crea un modelo por marca + nombre (idempotente)."""
    modelo = _obtener_o_crear_modelo(db, payload.nombre, payload.id_marca)
    db.commit()
    db.refresh(modelo)
    return modelo


@router.get("/{id_modelo}", response_model=ModeloOut)
def obtener(
    id_modelo: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    registro = db.query(Modelo).filter(Modelo.id_modelo == id_modelo).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Modelo no encontrado")
    return registro


@router.post("/", response_model=ModeloOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: ModeloCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    if db.query(Marca).filter(Marca.id_marca == payload.id_marca).first() is None:
        raise HTTPException(status_code=400, detail="Marca no existe")
    nuevo = Modelo(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_modelo}", response_model=ModeloOut)
def actualizar(
    id_modelo: int,
    payload: ModeloUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    registro = db.query(Modelo).filter(Modelo.id_modelo == id_modelo).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Modelo no encontrado")

    datos = payload.model_dump(exclude_unset=True)
    if (
        "id_marca" in datos
        and db.query(Marca).filter(Marca.id_marca == datos["id_marca"]).first() is None
    ):
        raise HTTPException(status_code=400, detail="Marca no existe")

    for campo, valor in datos.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_modelo}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_modelo: int, db: Session = Depends(get_db), current_user=Depends(require_editor)
):
    registro = db.query(Modelo).filter(Modelo.id_modelo == id_modelo).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Modelo no encontrado")

    db.delete(registro)
    db.commit()
    return None
