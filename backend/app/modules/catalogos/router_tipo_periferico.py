from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.activos.models import Periferico, TipoPeriferico
from app.modules.auth.dependencies import get_current_user, require_editor
from app.modules.catalogos.schemas import (
    TipoPerifericoCreate,
    TipoPerifericoOut,
    TipoPerifericoUpdate,
)

router = APIRouter(prefix="/tipos-periferico", tags=["tipos_periferico"])


def _obtener_o_crear_tipo_periferico(db: Session, nombre: str) -> TipoPeriferico:
    """Busca tipo de periférico por nombre (sin distinguir mayúsculas) o lo crea."""
    nombre = nombre.strip()
    if not nombre:
        raise HTTPException(
            status_code=400, detail="El nombre del tipo de periférico es obligatorio"
        )
    registro = (
        db.query(TipoPeriferico)
        .filter(func.lower(TipoPeriferico.nombre) == nombre.lower())
        .first()
    )
    if registro is None:
        registro = TipoPeriferico(nombre=nombre)
        db.add(registro)
        db.flush()
    return registro


@router.get("/", response_model=list[TipoPerifericoOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todos los tipos de periférico."""
    return db.query(TipoPeriferico).all()


@router.post("/ensure", response_model=TipoPerifericoOut)
def ensure(
    payload: TipoPerifericoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Obtiene o crea un tipo de periférico por nombre (idempotente)."""
    registro = _obtener_o_crear_tipo_periferico(db, payload.nombre)
    db.commit()
    db.refresh(registro)
    return registro


@router.get("/{id_tipoper}", response_model=TipoPerifericoOut)
def obtener(
    id_tipoper: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Devuelve un tipo de periférico por id."""
    registro = (
        db.query(TipoPeriferico).filter(TipoPeriferico.id_tipoper == id_tipoper).first()
    )
    if registro is None:
        raise HTTPException(status_code=404, detail="Tipo de periférico no encontrado")
    return registro


@router.post("/", response_model=TipoPerifericoOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: TipoPerifericoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    nuevo = TipoPeriferico(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_tipoper}", response_model=TipoPerifericoOut)
def actualizar(
    id_tipoper: int,
    payload: TipoPerifericoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    registro = (
        db.query(TipoPeriferico).filter(TipoPeriferico.id_tipoper == id_tipoper).first()
    )
    if registro is None:
        raise HTTPException(status_code=404, detail="Tipo de periférico no encontrado")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_tipoper}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_tipoper: int, db: Session = Depends(get_db), current_user=Depends(require_editor)
):
    registro = (
        db.query(TipoPeriferico).filter(TipoPeriferico.id_tipoper == id_tipoper).first()
    )
    if registro is None:
        raise HTTPException(status_code=404, detail="Tipo de periférico no encontrado")

    tiene_hijos = (
        db.query(Periferico).filter(Periferico.id_tipoper == id_tipoper).first()
    )
    if tiene_hijos:
        raise HTTPException(
            status_code=400, detail="No se puede eliminar: tiene registros asociados"
        )

    db.delete(registro)
    db.commit()
    return None
