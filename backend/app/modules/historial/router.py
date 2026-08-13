from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.activos.models import ActivoTi
from app.modules.auth.dependencies import get_current_user, require_editor
from app.modules.catalogos.models_tipo_estado import TipoEstado
from app.modules.historial.models import HistorialEstado
from app.modules.historial.schemas import HistorialEstadoCreate, HistorialEstadoOut
from app.modules.usuarios.models import UsuarioSistema

router = APIRouter(prefix="/historial_estado", tags=["Historial de estados"])


@router.get("/", response_model=list[HistorialEstadoOut])
def listar(
    id_act: Optional[int] = None,
    id_tipoe: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Devuelve historial de estados."""
    query = db.query(HistorialEstado)

    if id_act is not None:
        query = query.filter(HistorialEstado.id_act == id_act)

    if id_tipoe is not None:
        query = query.filter(HistorialEstado.id_tipoe == id_tipoe)

    return query.all()


@router.get("/{id_hes}", response_model=HistorialEstadoOut)
def obtener(
    id_hes: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Devuelve historial por id."""
    his = db.query(HistorialEstado).filter(HistorialEstado.id_hes == id_hes).first()
    if his is None:
        raise HTTPException(status_code=404, detail="Historial no encontrado")
    return his


@router.post(
    "/", response_model=HistorialEstadoOut, status_code=status.HTTP_201_CREATED
)
def crear(
    payload: HistorialEstadoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    if (
        db.query(TipoEstado).filter(TipoEstado.id_tipoe == payload.id_tipoe).first()
        is None
    ):
        raise HTTPException(status_code=400, detail="Tipo estado no existe")

    if db.query(ActivoTi).filter(ActivoTi.id_act == payload.id_act).first() is None:
        raise HTTPException(status_code=400, detail="Activo no existe")

    datos = payload.model_dump()
    if not datos.get("id_usuario_reg"):
        datos["id_usuario_reg"] = current_user.id_usuario
    else:
        if (
            db.query(UsuarioSistema)
            .filter(UsuarioSistema.id_usuario == datos["id_usuario_reg"])
            .first()
            is None
        ):
            raise HTTPException(status_code=400, detail="Usuario no existe")

    nuevo_historial = HistorialEstado(**datos)

    db.add(nuevo_historial)
    activo = db.query(ActivoTi).filter(ActivoTi.id_act == payload.id_act).first()
    activo.id_tipoe = payload.id_tipoe
    db.commit()
    db.refresh(nuevo_historial)
    return nuevo_historial
