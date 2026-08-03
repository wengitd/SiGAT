from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user, require_editor
from database import get_db
from schemas.checklist_schema import (
    ChecklistIniciar,
    ChecklistOut,
    ChecklistPasoOut,
    ChecklistPasoUpdate,
    ElegibilidadOut,
)
from services import checklist_service as svc

router = APIRouter(prefix="/Checklist", tags=["Checklist"])


@router.get("/", response_model=list[ChecklistOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todos los checklists (con pasos)."""
    from models.checklist_model import Checklist
    from sqlalchemy.orm import joinedload

    rows = (
        db.query(Checklist)
        .options(joinedload(Checklist.pasos), joinedload(Checklist.plantilla))
        .order_by(Checklist.id_check.desc())
        .all()
    )
    return [svc.enrich_checklist_out(c) for c in rows]


@router.get("/activo/{id_act}", response_model=list[ChecklistOut])
def listar_por_activo(
    id_act: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return svc.listar_por_activo(db, id_act)


@router.get("/activo/{id_act}/elegibilidad", response_model=ElegibilidadOut)
def elegibilidad(
    id_act: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return svc.evaluar_elegibilidad(db, id_act)


@router.get("/{id_check}", response_model=ChecklistOut)
def obtener(
    id_check: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    checklist = svc.checklist_con_pasos(db, id_check)
    if checklist is None:
        raise HTTPException(status_code=404, detail="Checklist no encontrado")
    return checklist


@router.post("/iniciar", response_model=ChecklistOut, status_code=status.HTTP_201_CREATED)
def iniciar(
    payload: ChecklistIniciar,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    return svc.iniciar_checklist(
        db,
        id_act=payload.id_act,
        proposito=payload.proposito,
        id_plantilla=payload.id_plantilla,
        id_usuario=current_user.id_usuario,
    )


@router.put("/pasos/{id_cpaso}", response_model=ChecklistPasoOut)
def actualizar_paso(
    id_cpaso: int,
    payload: ChecklistPasoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    datos = payload.model_dump(exclude_unset=True)
    return svc.actualizar_paso(
        db,
        id_cpaso=id_cpaso,
        estado=datos.get("estado"),
        observacion=datos.get("observacion"),
        observacion_set="observacion" in datos,
    )


@router.post("/{id_check}/cerrar", response_model=ChecklistOut)
def cerrar(
    id_check: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    return svc.cerrar_checklist(db, id_check)


@router.post("/{id_check}/cancelar", response_model=ChecklistOut)
def cancelar(
    id_check: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    return svc.cancelar_checklist(db, id_check)
