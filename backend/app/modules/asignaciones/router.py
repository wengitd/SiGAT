from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.activos.models import ActivoTi, Disponibilidad
from app.modules.asignaciones import storage as acta_storage
from app.modules.asignaciones.models import Asignacion
from app.modules.asignaciones.schemas import (
    AsignacionCreate,
    AsignacionOut,
    AsignacionUpdate,
)
from app.modules.auth.dependencies import get_current_user, require_editor
from app.modules.checklist.service import validar_gate_asignacion
from app.modules.empleados.models import Empleado

router = APIRouter(prefix="/asignaciones", tags=["Asignaciones"])


@router.get("/", response_model=list[AsignacionOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    "Devuelve todos las asignaciones."
    # return.db.query(model.py)
    return db.query(Asignacion).all()


@router.get("/{id_asig}", response_model=AsignacionOut)
def obtener(
    id_asig: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Devuelve una Asignacion por id."""
    asig = db.query(Asignacion).filter(Asignacion.id_asig == id_asig).first()
    if asig is None:
        raise HTTPException(status_code=404, detail="Asignacion no encontrada")
    return asig


@router.post("/", response_model=AsignacionOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: AsignacionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    # Bloque para las FK y validaciones
    activo = db.query(ActivoTi).filter(ActivoTi.id_act == payload.id_act).first()
    if activo is None:
        raise HTTPException(status_code=400, detail="Activo no existe")

    dispo_actual = db.query(Disponibilidad).filter(Disponibilidad.id_dispo == activo.id_dispo).first()
    if dispo_actual is not None and dispo_actual.nombre.lower() == "de baja":
        raise HTTPException(status_code=400, detail="Un activo dado de baja no puede ser asignado")

    query_emp = db.query(Empleado).filter(Empleado.id_emp == payload.id_emp).first()
    if query_emp is None:
        raise HTTPException(status_code=400, detail="Empleado no existe")
    if query_emp.operatividad == False:
        raise HTTPException(status_code=400, detail="Empleado inactivo")

    # Gate de checklist para equipos de cómputo (preparación / reasignación)
    validar_gate_asignacion(db, activo)

    # Verificar si el activo ya tiene una asignación vigente (sin fecha de devolución)
    query_asig = (
        db.query(Asignacion)
        .filter(
            Asignacion.id_act == payload.id_act,
            Asignacion.fecha_dev.is_(None),
        )
        .first()
    )

    if query_asig is not None:
        if query_asig.id_emp == payload.id_emp:
            raise HTTPException(status_code=400, detail="El activo ya está asignado a este empleado")
        # Si es un empleado distinto -> REASIGNACIÓN AUTOMÁTICA
        # Se cierra la asignación previa registrando la fecha de devolución como la fecha de entrega del nuevo registro
        query_asig.fecha_dev = payload.fecha_entr
        db.add(query_asig)

    # Crear la nueva asignación (ruta_acta_entr solo se setea vía upload)
    datos = payload.model_dump()
    datos["ruta_acta_entr"] = None
    datos["id_usuario_reg"] = current_user.id_usuario
    nueva_asig = Asignacion(**datos)
    db.add(nueva_asig)

    # Actualizar disponibilidad del activo a 'Asignado'
    dispo_asignado = (
        db.query(Disponibilidad)
        .filter(func.lower(Disponibilidad.nombre) == "asignado")
        .first()
    )
    if dispo_asignado is None:
        raise HTTPException(
            status_code=400,
            detail="No existe la disponibilidad 'Asignado' en el catálogo",
        )
    activo.id_dispo = dispo_asignado.id_dispo

    db.commit()
    db.refresh(nueva_asig)
    return nueva_asig


@router.put("/{id_asig}", response_model=AsignacionOut)
def actualizar(
    id_asig: int,
    payload: AsignacionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    act_asig = db.query(Asignacion).filter(Asignacion.id_asig == id_asig).first()

    if act_asig is None:
        raise HTTPException(status_code=404, detail="No encontrado")

    if act_asig.fecha_dev is not None:
        raise HTTPException(status_code=400, detail="La devolución ya fue registrada")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(act_asig, campo, valor)

    # Al registrar devolución, si fecha_dev no es nulo, actualizar disponibilidad del activo a 'disponible' (id_dispo = 1)
    if act_asig.fecha_dev is not None:
        activo = db.query(ActivoTi).filter(ActivoTi.id_act == act_asig.id_act).first()
        if activo:
            activo.id_dispo = 1

    db.commit()
    db.refresh(act_asig)
    return act_asig


@router.post(
    "/{id_asig}/acta",
    response_model=AsignacionOut,
    status_code=status.HTTP_201_CREATED,
)
async def subir_acta(
    id_asig: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Adjunta el acta de entrega (PDF o imagen) a una asignación existente."""
    asig = db.query(Asignacion).filter(Asignacion.id_asig == id_asig).first()
    if asig is None:
        raise HTTPException(status_code=404, detail="Asignacion no encontrada")
    if asig.ruta_acta_entr:
        raise HTTPException(
            status_code=400,
            detail="La asignación ya tiene un acta; use reemplazar",
        )

    data, ext = await acta_storage.validate_acta(file)
    ruta_relativa = acta_storage.save_acta(id_asig, data, ext)

    try:
        asig.ruta_acta_entr = ruta_relativa
        db.commit()
        db.refresh(asig)
        return asig
    except Exception:
        db.rollback()
        acta_storage.delete_acta(ruta_relativa)
        raise


@router.get("/{id_asig}/acta")
def obtener_acta(
    id_asig: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Sirve el archivo del acta de entrega desde el volumen local."""
    asig = db.query(Asignacion).filter(Asignacion.id_asig == id_asig).first()
    if asig is None:
        raise HTTPException(status_code=404, detail="Asignacion no encontrada")
    if not asig.ruta_acta_entr:
        raise HTTPException(status_code=404, detail="Acta de entrega no encontrada")

    path = acta_storage.absolute_path(asig.ruta_acta_entr)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Archivo de acta no encontrado")

    return FileResponse(
        path,
        media_type=acta_storage.media_type_from_ruta(asig.ruta_acta_entr),
        filename=path.name,
        content_disposition_type="inline",
    )


@router.put("/{id_asig}/acta", response_model=AsignacionOut)
async def reemplazar_acta(
    id_asig: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Reemplaza el acta de entrega de una asignación existente."""
    asig = db.query(Asignacion).filter(Asignacion.id_asig == id_asig).first()
    if asig is None:
        raise HTTPException(status_code=404, detail="Asignacion no encontrada")

    data, ext = await acta_storage.validate_acta(file)
    ruta_anterior = asig.ruta_acta_entr
    ruta_nueva = acta_storage.save_acta(id_asig, data, ext)

    try:
        asig.ruta_acta_entr = ruta_nueva
        db.commit()
        db.refresh(asig)
        if ruta_anterior and ruta_anterior != ruta_nueva:
            acta_storage.delete_acta(ruta_anterior)
        return asig
    except Exception:
        db.rollback()
        acta_storage.delete_acta(ruta_nueva)
        raise
