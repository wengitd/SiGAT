from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from database import get_db
from auth.dependencies import get_current_user, require_editor

from models.solicitud_baja_model import SolicitudBaja
from models.activo_ti_model import ActivoTi, Disponibilidad
from models.empleado_model import UsuarioSistema
from schemas.solicitud_baja_schema import (
    SolicitudBajaCreate, SolicitudBajaResolver, SolicitudBajaBorrado, SolicitudBajaOut
)

from routes.activo_route import validar_dispo_estado

router = APIRouter(prefix="/solicitudes-baja", tags=["Solicitudes de baja"])


@router.get("/", response_model=list[SolicitudBajaOut])
def listar(estado_sol: Optional[str] = None, id_act: Optional[int] = None,
           db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve las solicitudes de baja, con filtros opcionales por estado o activo."""
    query = db.query(SolicitudBaja)

    if estado_sol is not None:
        query = query.filter(SolicitudBaja.estado_sol == estado_sol)
    if id_act is not None:
        query = query.filter(SolicitudBaja.id_act == id_act)

    return query.all()


@router.get("/{id_solbaja}", response_model=SolicitudBajaOut)
def obtener(id_solbaja: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve una solicitud de baja por id."""
    sol = db.query(SolicitudBaja).filter(SolicitudBaja.id_solbaja == id_solbaja).first()
    if sol is None:
        raise HTTPException(status_code=404, detail="Solicitud de baja no encontrada")
    return sol


@router.post("/", response_model=SolicitudBajaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: SolicitudBajaCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """El solicitante registra una solicitud de baja para un activo."""
    if db.query(ActivoTi).filter(ActivoTi.id_act == payload.id_act).first() is None:
        raise HTTPException(status_code=400, detail="Activo no existe")

    ya_pendiente = db.query(SolicitudBaja).filter(
        SolicitudBaja.id_act == payload.id_act,
        SolicitudBaja.estado_sol == "pendiente",
    ).first()
    if ya_pendiente is not None:
        raise HTTPException(status_code=400, detail="El activo ya tiene una solicitud de baja pendiente")

    nueva = SolicitudBaja(**payload.model_dump(), id_emp_sol=current_user.id_emp)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.put("/{id_solbaja}/resolver", response_model=SolicitudBajaOut)
def resolver(id_solbaja: int, payload: SolicitudBajaResolver,
             db: Session = Depends(get_db), current_user=Depends(require_editor)):
    """Registra la aprobación o rechazo de jefatura, decidida por fuera del sistema (correo)."""
    sol = db.query(SolicitudBaja).filter(SolicitudBaja.id_solbaja == id_solbaja).first()
    if sol is None:
        raise HTTPException(status_code=404, detail="Solicitud de baja no encontrada")

    if sol.estado_sol != "pendiente":
        raise HTTPException(status_code=400, detail="La solicitud ya fue resuelta")

    if payload.id_emp_aprob is not None:
        if db.query(Empleado).filter(Empleado.id_emp == payload.id_emp_aprob).first() is None:
            raise HTTPException(status_code=400, detail="Empleado aprobador no existe")

    sol.estado_sol = payload.estado_sol
    sol.ref_aprob = payload.ref_aprob
    sol.id_emp_aprob = payload.id_emp_aprob
    sol.fecha_resolucion = date.today()

    db.commit()
    db.refresh(sol)
    return sol


@router.put("/{id_solbaja}/borrado", response_model=SolicitudBajaOut)
def registrar_borrado(id_solbaja: int, payload: SolicitudBajaBorrado,
                       db: Session = Depends(get_db), current_user=Depends(require_editor)):
    """Cierra el proceso: registra el borrado seguro de datos y pasa el activo a disponibilidad 'de_baja'."""
    sol = db.query(SolicitudBaja).filter(SolicitudBaja.id_solbaja == id_solbaja).first()
    if sol is None:
        raise HTTPException(status_code=404, detail="Solicitud de baja no encontrada")

    if sol.estado_sol != "aprobada":
        raise HTTPException(status_code=400, detail="Solo se puede registrar el borrado de una solicitud aprobada")

    if sol.fecha_borrado is not None:
        raise HTTPException(status_code=400, detail="El borrado de este activo ya fue registrado")

    dispo_baja = next(
        (d for d in db.query(Disponibilidad).all() if d.nombre.strip().lower() == "de_baja"),
        None,
    )
    if dispo_baja is None:
        raise HTTPException(
            status_code=400,
            detail="No existe la disponibilidad 'de_baja' en el catálogo; créala primero en el mantenedor",
        )

    activo = db.query(ActivoTi).filter(ActivoTi.id_act == sol.id_act).first()
    validar_dispo_estado(dispo_baja.id_dispo, activo.id_tipoe, db)

    activo.id_dispo = dispo_baja.id_dispo
    sol.ruta_acta_baja = payload.ruta_acta_baja
    sol.fecha_borrado = date.today()
    sol.id_emp_borrado = current_user.id_emp

    db.commit()
    db.refresh(sol)
    return sol
