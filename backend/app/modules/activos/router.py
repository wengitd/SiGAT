"""Endpoints HTTP del dominio Activos TI (capa delgada)."""

from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.activos import repository as repo
from app.modules.activos import service as activos_service
from app.modules.activos.schemas import ActivoCreate, ActivoOut, ActivoUpdate
from app.modules.auth.dependencies import get_current_user, require_editor

router = APIRouter(prefix="/ActivoTi", tags=["Activos"])


@router.get("/", response_model=list[ActivoOut], response_model_exclude_none=True)
def listar(
    tipo: Optional[Literal["Equipo Computo", "Periferico"]] = Query(None),
    id_dispo: Optional[int] = Query(None),
    id_tipoe: Optional[int] = Query(None),
    mac: Optional[str] = Query(None, description="Filtro parcial por MAC ethernet o wifi"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return activos_service.listar_activos(
        db, tipo=tipo, id_dispo=id_dispo, id_tipoe=id_tipoe, mac=mac
    )


@router.get("/sugerencias/cpu", response_model=list[str])
def sugerencias_cpu(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return repo.sugerencias_cpu(db)


@router.get("/sugerencias/u-medida", response_model=list[str])
def sugerencias_u_medida(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return repo.sugerencias_u_medida(db)


@router.get("/existe-serie")
def existe_serie(
    num_serie: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return activos_service.check_existe_serie(db, num_serie)


@router.get("/{id_act}", response_model=ActivoOut, response_model_exclude_none=True)
def obtener(
    id_act: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return activos_service.obtener_activo(db, id_act)


@router.post(
    "/",
    response_model=ActivoOut,
    status_code=status.HTTP_201_CREATED,
    response_model_exclude_none=True,
)
def crear(
    payload: ActivoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    return activos_service.crear_activo(db, payload)


@router.put("/{id_act}", response_model=ActivoOut, response_model_exclude_none=True)
def actualizar(
    id_act: int,
    payload: ActivoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    return activos_service.actualizar_activo(
        db, id_act, payload, id_usuario=current_user.id_usuario
    )


@router.delete("/{id_act}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_act: int, db: Session = Depends(get_db), current_user=Depends(require_editor)
):
    activos_service.eliminar_activo(db, id_act)
    return None
