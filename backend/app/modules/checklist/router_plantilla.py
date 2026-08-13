from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user, require_editor
from app.modules.checklist.models import Plantilla, PlantillaPaso
from app.modules.checklist.schemas import (
    PlantillaCreate,
    PlantillaOut,
    PlantillaPasoCreate,
    PlantillaPasoOut,
    PlantillaPasoUpdate,
    PlantillaUpdate,
)

router = APIRouter(prefix="/Plantilla", tags=["Plantilla"])


def _cargar(db: Session, id_plantilla: int) -> Plantilla | None:
    return (
        db.query(Plantilla)
        .options(joinedload(Plantilla.pasos))
        .filter(Plantilla.id_plantilla == id_plantilla)
        .first()
    )


@router.get("/", response_model=list[PlantillaOut])
def listar(
    proposito: str | None = Query(default=None),
    vigente: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Devuelve plantillas con pasos. Filtros opcionales: proposito, vigente."""
    q = db.query(Plantilla).options(joinedload(Plantilla.pasos))
    if proposito is not None:
        q = q.filter(Plantilla.proposito == proposito)
    if vigente is not None:
        q = q.filter(Plantilla.vigente.is_(vigente))
    return q.order_by(Plantilla.proposito, Plantilla.id_plantilla).all()


@router.get("/{id_plantilla}", response_model=PlantillaOut)
def obtener(
    id_plantilla: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    plantilla = _cargar(db, id_plantilla)
    if plantilla is None:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return plantilla


@router.post("/", response_model=PlantillaOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: PlantillaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    plantilla = Plantilla(
        nombre=payload.nombre,
        proposito=payload.proposito,
        vigente=payload.vigente,
    )
    db.add(plantilla)
    db.flush()

    for paso in payload.pasos:
        db.add(
            PlantillaPaso(
                id_plantilla=plantilla.id_plantilla,
                descr=paso.descr,
                orden=paso.orden,
                activo=paso.activo,
            )
        )

    db.commit()
    return _cargar(db, plantilla.id_plantilla)


@router.put("/{id_plantilla}", response_model=PlantillaOut)
def actualizar(
    id_plantilla: int,
    payload: PlantillaUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    plantilla = _cargar(db, id_plantilla)
    if plantilla is None:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(plantilla, campo, valor)

    db.commit()
    return _cargar(db, id_plantilla)


@router.post(
    "/{id_plantilla}/pasos",
    response_model=PlantillaPasoOut,
    status_code=status.HTTP_201_CREATED,
)
def agregar_paso(
    id_plantilla: int,
    payload: PlantillaPasoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    plantilla = db.query(Plantilla).filter(Plantilla.id_plantilla == id_plantilla).first()
    if plantilla is None:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    paso = PlantillaPaso(
        id_plantilla=id_plantilla,
        descr=payload.descr,
        orden=payload.orden,
        activo=payload.activo,
    )
    db.add(paso)
    db.commit()
    db.refresh(paso)
    return paso


@router.put("/pasos/{id_paso}", response_model=PlantillaPasoOut)
def actualizar_paso(
    id_paso: int,
    payload: PlantillaPasoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    paso = db.query(PlantillaPaso).filter(PlantillaPaso.id_paso == id_paso).first()
    if paso is None:
        raise HTTPException(status_code=404, detail="Paso no encontrado")

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(paso, campo, valor)

    db.commit()
    db.refresh(paso)
    return paso


@router.delete("/pasos/{id_paso}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_paso(
    id_paso: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Desactiva el paso (no borra, para preservar historial de checklists)."""
    paso = db.query(PlantillaPaso).filter(PlantillaPaso.id_paso == id_paso).first()
    if paso is None:
        raise HTTPException(status_code=404, detail="Paso no encontrado")
    paso.activo = False
    db.commit()
    return None
