from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.activos.models import ActivoTi, Disponibilidad
from app.modules.activos.service import validar_dispo_estado
from app.modules.auth.dependencies import get_current_user, require_editor
from app.modules.catalogos.models_tipo_estado import TipoEstado
from app.modules.empleados.models import Empleado
from app.modules.solicitudes_baja.models import SolicitudBaja
from app.modules.solicitudes_baja.schemas import (
    SolicitudBajaBorrado,
    SolicitudBajaCreate,
    SolicitudBajaOut,
    SolicitudBajaResolver,
)
from app.modules.usuarios.models import UsuarioSistema

router = APIRouter(prefix="/solicitudes-baja", tags=["Solicitudes de baja"])


@router.get("/", response_model=list[SolicitudBajaOut])
def listar(
    estado_sol: Optional[str] = None,
    id_act: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Devuelve las solicitudes de baja, con filtros opcionales por estado o activo."""
    query = db.query(SolicitudBaja)

    if estado_sol is not None:
        query = query.filter(SolicitudBaja.estado_sol == estado_sol)
    if id_act is not None:
        query = query.filter(SolicitudBaja.id_act == id_act)

    return query.all()


@router.get("/{id_solbaja}", response_model=SolicitudBajaOut)
def obtener(
    id_solbaja: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Devuelve una solicitud de baja por id."""
    sol = db.query(SolicitudBaja).filter(SolicitudBaja.id_solbaja == id_solbaja).first()
    if sol is None:
        raise HTTPException(status_code=404, detail="Solicitud de baja no encontrada")
    return sol


@router.post("/", response_model=SolicitudBajaOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: SolicitudBajaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """El solicitante registra una solicitud de baja para un activo y degrada su condición."""
    activo = db.query(ActivoTi).filter(ActivoTi.id_act == payload.id_act).first()
    if activo is None:
        raise HTTPException(status_code=400, detail="Activo no existe")

    ya_vigente = (
        db.query(SolicitudBaja)
        .filter(
            SolicitudBaja.id_act == payload.id_act,
            SolicitudBaja.estado_sol != "Rechazada",
        )
        .first()
    )
    if ya_vigente is not None:
        raise HTTPException(
            status_code=400,
            detail="El activo ya tiene una solicitud de baja pendiente o aprobada",
        )

    estado = (
        db.query(TipoEstado).filter(TipoEstado.id_tipoe == payload.id_tipoe).first()
    )
    if estado is None:
        raise HTTPException(status_code=400, detail="Tipo de estado no existe")
    if estado.nombre.lower() == "bueno":
        raise HTTPException(
            status_code=400,
            detail="Un activo en solicitud de baja no puede quedar en estado 'Bueno'; selecciona 'Regular' o 'Malo'",
        )

    validar_dispo_estado(activo.id_dispo, payload.id_tipoe, db)

    datos = payload.model_dump(exclude={"id_tipoe"})
    nueva = SolicitudBaja(**datos, id_usuario_sol=current_user.id_usuario)
    activo.id_tipoe = payload.id_tipoe
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.put("/{id_solbaja}/resolver", response_model=SolicitudBajaOut)
def resolver(
    id_solbaja: int,
    payload: SolicitudBajaResolver,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Registra la aprobación o rechazo de jefatura, decidida por fuera del sistema (correo)."""
    sol = db.query(SolicitudBaja).filter(SolicitudBaja.id_solbaja == id_solbaja).first()
    if sol is None:
        raise HTTPException(status_code=404, detail="Solicitud de baja no encontrada")

    if sol.estado_sol != "Pendiente":
        raise HTTPException(status_code=400, detail="La solicitud ya fue resuelta")

    sol.estado_sol = payload.estado_sol
    sol.ref_aprob = payload.ref_aprob
    sol.id_usuario_aprob = current_user.id_usuario
    sol.fecha_resolucion = date.today()

    db.commit()
    db.refresh(sol)
    return sol


@router.put("/{id_solbaja}/borrado", response_model=SolicitudBajaOut)
def registrar_borrado(
    id_solbaja: int,
    payload: SolicitudBajaBorrado,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Cierra el proceso: registra el borrado seguro de datos y pasa el activo a disponibilidad 'De Baja'."""
    sol = db.query(SolicitudBaja).filter(SolicitudBaja.id_solbaja == id_solbaja).first()
    if sol is None:
        raise HTTPException(status_code=404, detail="Solicitud de baja no encontrada")

    if sol.estado_sol != "Aprobada":
        raise HTTPException(
            status_code=400,
            detail="Solo se puede registrar el borrado de una solicitud aprobada",
        )

    if sol.fecha_borrado is not None:
        raise HTTPException(
            status_code=400, detail="El borrado de este activo ya fue registrado"
        )

    dispo_baja = next(
        (
            d
            for d in db.query(Disponibilidad).all()
            if d.nombre.strip().lower() == "de baja"
        ),
        None,
    )
    if dispo_baja is None:
        raise HTTPException(
            status_code=400,
            detail="No existe la disponibilidad 'De Baja' en el catálogo; créala primero en el mantenedor",
        )

    activo = db.query(ActivoTi).filter(ActivoTi.id_act == sol.id_act).first()
    validar_dispo_estado(dispo_baja.id_dispo, activo.id_tipoe, db)

    activo.id_dispo = dispo_baja.id_dispo
    sol.ruta_acta_baja = payload.ruta_acta_baja
    sol.fecha_borrado = date.today()
    sol.id_usuario_borrado = current_user.id_usuario

    db.commit()
    db.refresh(sol)
    return sol
