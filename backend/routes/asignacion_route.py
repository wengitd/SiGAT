from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.asignacion_model import Asignacion
from schemas.asignacion_schema import AsignacionCreate, AsignacionUpdate, AsignacionOut
from auth.dependencies import get_current_user, require_editor


from models.activo_ti_model import ActivoTi, Disponibilidad
from models.empleado_model import Empleado
from services.checklist_service import validar_gate_asignacion

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

    # Crear la nueva asignación
    datos = payload.model_dump()
    datos["id_usuario_reg"] = current_user.id_usuario
    nueva_asig = Asignacion(**datos)
    db.add(nueva_asig)

    # Actualizar disponibilidad del activo a 'asignado'
    dispo_asignado = (
        db.query(Disponibilidad)
        .filter(Disponibilidad.nombre == "asignado")
        .first()
    )
    if dispo_asignado is None:
        raise HTTPException(
            status_code=400,
            detail="No existe la disponibilidad 'asignado' en el catálogo",
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
