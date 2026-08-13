from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.activos.models import EquipoComputo, TipoEquipo
from app.modules.auth.dependencies import get_current_user, require_editor
from app.modules.catalogos.schemas import (
    TipoEquipoCreate,
    TipoEquipoOut,
    TipoEquipoUpdate,
)

router = APIRouter(prefix="/tipos-equipo", tags=["tipos_equipo"])


def _obtener_o_crear_tipo_equipo(db: Session, nombre: str) -> TipoEquipo:
    """Busca tipo de equipo por nombre (sin distinguir mayúsculas) o lo crea."""
    nombre = nombre.strip()
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre del tipo de equipo es obligatorio")
    registro = (
        db.query(TipoEquipo)
        .filter(func.lower(TipoEquipo.nombre) == nombre.lower())
        .first()
    )
    if registro is None:
        registro = TipoEquipo(nombre=nombre)
        db.add(registro)
        db.flush()
    return registro


@router.get("/", response_model=list[TipoEquipoOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todos los tipos de equipo."""
    return db.query(TipoEquipo).all()


@router.post("/ensure", response_model=TipoEquipoOut)
def ensure(
    payload: TipoEquipoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Obtiene o crea un tipo de equipo por nombre (idempotente)."""
    registro = _obtener_o_crear_tipo_equipo(db, payload.nombre)
    db.commit()
    db.refresh(registro)
    return registro


@router.get("/{id_tipoeq}", response_model=TipoEquipoOut)
def obtener(
    id_tipoeq: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Devuelve un tipo de equipo por id."""
    registro = db.query(TipoEquipo).filter(TipoEquipo.id_tipoeq == id_tipoeq).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Tipo de equipo no encontrado")
    return registro


@router.post("/", response_model=TipoEquipoOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: TipoEquipoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    nuevo = TipoEquipo(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_tipoeq}", response_model=TipoEquipoOut)
def actualizar(
    id_tipoeq: int,
    payload: TipoEquipoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    registro = db.query(TipoEquipo).filter(TipoEquipo.id_tipoeq == id_tipoeq).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Tipo de equipo no encontrado")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_tipoeq}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_tipoeq: int, db: Session = Depends(get_db), current_user=Depends(require_editor)
):
    registro = db.query(TipoEquipo).filter(TipoEquipo.id_tipoeq == id_tipoeq).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Tipo de equipo no encontrado")

    tiene_hijos = (
        db.query(EquipoComputo).filter(EquipoComputo.id_tipoeq == id_tipoeq).first()
    )
    if tiene_hijos:
        raise HTTPException(
            status_code=400, detail="No se puede eliminar: tiene registros asociados"
        )

    db.delete(registro)
    db.commit()
    return None
