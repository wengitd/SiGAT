from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user, require_editor
from models.activo_ti_model import Disponibilidad, EstadoDispo
from schemas.disponibilidad_schema import (
    DisponibilidadCreate,
    DisponibilidadUpdate,
    DisponibilidadOut,
    EstadoDispoCreate,
    EstadoDispoOut,
)

router = APIRouter(prefix="/disponibilidades", tags=["Disponibilidad"])


@router.get("/", response_model=list[DisponibilidadOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Disponibilidad).all()


@router.post("/", response_model=DisponibilidadOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: DisponibilidadCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if db.query(Disponibilidad).filter(Disponibilidad.nombre == payload.nombre).first():
        raise HTTPException(status_code=400, detail="Esa disponibilidad ya existe")

    nuevo = Disponibilidad(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_dispo}", response_model=DisponibilidadOut)
def actualizar(
    id_dispo: int,
    payload: DisponibilidadUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    registro = (
        db.query(Disponibilidad).filter(Disponibilidad.id_dispo == id_dispo).first()
    )
    if registro is None:
        raise HTTPException(status_code=404, detail="Disponibilidad no encontrada")

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_dispo}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_dispo: int, db: Session = Depends(get_db), current_user=Depends(require_editor)
):
    registro = (
        db.query(Disponibilidad).filter(Disponibilidad.id_dispo == id_dispo).first()
    )
    if registro is None:
        raise HTTPException(status_code=404, detail="Disponibilidad no encontrada")

    db.delete(registro)
    db.commit()
    return None


# ── EstadoDispo ──────────────────────────────────────────────────────────────


@router.get("/por-estado/{id_tipoe}", response_model=list[DisponibilidadOut])
def disponibilidades_por_estado(
    id_tipoe: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Devuelve las disponibilidades permitidas para un estado dado."""
    permitidas = (
        db.query(Disponibilidad)
        .join(EstadoDispo, EstadoDispo.id_dispo == Disponibilidad.id_dispo)
        .filter(EstadoDispo.id_tipoe == id_tipoe)
        .all()
    )
    return permitidas


@router.get("/relaciones", response_model=list[EstadoDispoOut])
def listar_relaciones(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return db.query(EstadoDispo).all()


@router.post(
    "/relaciones", response_model=EstadoDispoOut, status_code=status.HTTP_201_CREATED
)
def crear_relacion(
    payload: EstadoDispoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    existe = (
        db.query(EstadoDispo)
        .filter_by(id_tipoe=payload.id_tipoe, id_dispo=payload.id_dispo)
        .first()
    )
    if existe:
        raise HTTPException(status_code=400, detail="Relación ya existe")
    nueva = EstadoDispo(**payload.model_dump())
    db.add(nueva)
    db.commit()
    return nueva


@router.delete(
    "/relaciones/{id_tipoe}/{id_dispo}", status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_relacion(
    id_tipoe: int,
    id_dispo: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    rel = db.query(EstadoDispo).filter_by(id_tipoe=id_tipoe, id_dispo=id_dispo).first()
    if rel is None:
        raise HTTPException(status_code=404, detail="Relación no encontrada")
    db.delete(rel)
    db.commit()
    return None
