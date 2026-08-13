"""Lógica de negocio para plantillas y checklists de preparación/reasignación."""

from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.modules.activos.models import ActivoTi
from app.modules.asignaciones.models import Asignacion
from app.modules.checklist.models import (
    Checklist,
    ChecklistPaso,
    Plantilla,
    PlantillaPaso,
)

ESTADOS_RESUELTOS = {"Completado", "No Aplica"}


def get_plantilla(db: Session, id_plantilla: int) -> Plantilla | None:
    return (
        db.query(Plantilla)
        .options(joinedload(Plantilla.pasos))
        .filter(Plantilla.id_plantilla == id_plantilla)
        .first()
    )


def enrich_checklist_out(checklist: Checklist) -> Checklist:
    """Adjunta nombre_plantilla como atributo dinámico para el schema de salida."""
    if checklist is not None and getattr(checklist, "plantilla", None) is not None:
        checklist.nombre_plantilla = checklist.plantilla.nombre
    elif checklist is not None:
        checklist.nombre_plantilla = None
    return checklist


def ensure_equipo_computo(activo: ActivoTi) -> None:
    if activo.tipo != "Equipo Computo":
        raise HTTPException(
            status_code=400,
            detail="Los checklists de preparación solo aplican a activos computacionales",
        )


def checklist_con_pasos(db: Session, id_check: int) -> Checklist | None:
    checklist = (
        db.query(Checklist)
        .options(joinedload(Checklist.pasos), joinedload(Checklist.plantilla))
        .filter(Checklist.id_check == id_check)
        .first()
    )
    return enrich_checklist_out(checklist) if checklist else None


def listar_por_activo(db: Session, id_act: int) -> list[Checklist]:
    rows = (
        db.query(Checklist)
        .options(joinedload(Checklist.pasos), joinedload(Checklist.plantilla))
        .filter(Checklist.id_act == id_act)
        .order_by(Checklist.fecha_ini.desc().nullslast(), Checklist.id_check.desc())
        .all()
    )
    return [enrich_checklist_out(c) for c in rows]


def iniciar_checklist(
    db: Session,
    *,
    id_act: int,
    proposito: str,
    id_plantilla: int,
    id_usuario: int,
) -> Checklist:
    activo = db.query(ActivoTi).filter(ActivoTi.id_act == id_act).first()
    if activo is None:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    ensure_equipo_computo(activo)

    abierto = (
        db.query(Checklist)
        .filter(
            Checklist.id_act == id_act,
            Checklist.proposito == proposito,
            Checklist.estado == "Abierto",
        )
        .first()
    )
    if abierto is not None:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un checklist de {proposito} abierto para este activo",
        )

    plantilla = get_plantilla(db, id_plantilla)
    if plantilla is None:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    if not plantilla.vigente:
        raise HTTPException(status_code=400, detail="La plantilla no está vigente")
    if plantilla.proposito != proposito:
        raise HTTPException(
            status_code=400,
            detail=f"La plantilla no corresponde al propósito {proposito}",
        )

    pasos_activos = [p for p in plantilla.pasos if p.activo]
    if not pasos_activos:
        raise HTTPException(
            status_code=400,
            detail="La plantilla no tiene pasos activos",
        )

    id_asig = None
    if proposito == "Reasignacion":
        asig_vigente = (
            db.query(Asignacion)
            .filter(Asignacion.id_act == id_act, Asignacion.fecha_dev.is_(None))
            .first()
        )
        if asig_vigente is None:
            raise HTTPException(
                status_code=400,
                detail="La reasignación requiere un activo con asignación vigente",
            )
        id_asig = asig_vigente.id_asig
    elif proposito == "Preparacion":
        asig_vigente = (
            db.query(Asignacion)
            .filter(Asignacion.id_act == id_act, Asignacion.fecha_dev.is_(None))
            .first()
        )
        if asig_vigente is not None:
            raise HTTPException(
                status_code=400,
                detail="El activo está asignado; use checklist de reasignación",
            )

    label = "Preparación" if proposito == "Preparacion" else "Reasignación"
    checklist = Checklist(
        nombre=f"{label} — {plantilla.nombre}",
        fecha_ini=date.today(),
        fecha_ter=None,
        proposito=proposito,
        estado="Abierto",
        id_usuario=id_usuario,
        id_act=id_act,
        id_asig=id_asig,
        id_plantilla=id_plantilla,
    )
    db.add(checklist)
    db.flush()

    for paso in sorted(pasos_activos, key=lambda p: p.orden):
        db.add(
            ChecklistPaso(
                id_check=checklist.id_check,
                id_paso=paso.id_paso,
                orden=paso.orden,
                descr=paso.descr,
                estado="Pendiente",
                observacion=None,
            )
        )

    db.commit()
    return checklist_con_pasos(db, checklist.id_check)


def actualizar_paso(
    db: Session,
    *,
    id_cpaso: int,
    estado: str | None,
    observacion: str | None,
    observacion_set: bool,
) -> ChecklistPaso:
    paso = db.query(ChecklistPaso).filter(ChecklistPaso.id_cpaso == id_cpaso).first()
    if paso is None:
        raise HTTPException(status_code=404, detail="Paso no encontrado")

    checklist = db.query(Checklist).filter(Checklist.id_check == paso.id_check).first()
    if checklist is None or checklist.estado != "Abierto":
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden editar pasos de un checklist abierto",
        )

    if estado is not None:
        paso.estado = estado
    if observacion_set:
        paso.observacion = observacion

    db.commit()
    db.refresh(paso)
    return paso


def cerrar_checklist(db: Session, id_check: int) -> Checklist:
    checklist = checklist_con_pasos(db, id_check)
    if checklist is None:
        raise HTTPException(status_code=404, detail="Checklist no encontrado")
    if checklist.estado != "Abierto":
        raise HTTPException(status_code=400, detail="El checklist no está abierto")

    pendientes = [p for p in checklist.pasos if p.estado not in ESTADOS_RESUELTOS]
    if pendientes:
        raise HTTPException(
            status_code=400,
            detail="Todos los pasos deben estar en completado o no_aplica para cerrar",
        )

    checklist.estado = "Cerrado"
    checklist.fecha_ter = date.today()
    db.commit()
    return checklist_con_pasos(db, id_check)


def cancelar_checklist(db: Session, id_check: int) -> Checklist:
    checklist = checklist_con_pasos(db, id_check)
    if checklist is None:
        raise HTTPException(status_code=404, detail="Checklist no encontrado")
    if checklist.estado != "Abierto":
        raise HTTPException(status_code=400, detail="Solo se pueden cancelar checklists abiertos")

    checklist.estado = "Cancelado"
    checklist.fecha_ter = date.today()
    db.commit()
    return checklist_con_pasos(db, id_check)


def _preparacion_valida(db: Session, id_act: int) -> Checklist | None:
    """Checklist de preparación cerrado vigente tras la última devolución (o desde el alta)."""
    ultima_dev = (
        db.query(Asignacion)
        .filter(Asignacion.id_act == id_act, Asignacion.fecha_dev.isnot(None))
        .order_by(Asignacion.fecha_dev.desc())
        .first()
    )

    q = (
        db.query(Checklist)
        .options(joinedload(Checklist.pasos))
        .filter(
            Checklist.id_act == id_act,
            Checklist.proposito == "Preparacion",
            Checklist.estado == "Cerrado",
        )
    )
    if ultima_dev and ultima_dev.fecha_dev is not None:
        q = q.filter(Checklist.fecha_ter >= ultima_dev.fecha_dev)

    return q.order_by(Checklist.fecha_ter.desc().nullslast(), Checklist.id_check.desc()).first()


def _reasignacion_valida(db: Session, id_act: int, id_asig: int) -> Checklist | None:
    return (
        db.query(Checklist)
        .options(joinedload(Checklist.pasos))
        .filter(
            Checklist.id_act == id_act,
            Checklist.proposito == "Reasignacion",
            Checklist.estado == "Cerrado",
            Checklist.id_asig == id_asig,
        )
        .order_by(Checklist.fecha_ter.desc().nullslast(), Checklist.id_check.desc())
        .first()
    )


def evaluar_elegibilidad(db: Session, id_act: int) -> dict:
    activo = db.query(ActivoTi).filter(ActivoTi.id_act == id_act).first()
    if activo is None:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    if activo.tipo != "Equipo Computo":
        return {
            "puede": True,
            "motivo": None,
            "checklist_abierto": None,
            "checklist_requerido": None,
        }

    asig_vigente = (
        db.query(Asignacion)
        .filter(Asignacion.id_act == id_act, Asignacion.fecha_dev.is_(None))
        .first()
    )

    if asig_vigente is None:
        abierto = (
            db.query(Checklist)
            .options(joinedload(Checklist.pasos), joinedload(Checklist.plantilla))
            .filter(
                Checklist.id_act == id_act,
                Checklist.proposito == "Preparacion",
                Checklist.estado == "Abierto",
            )
            .first()
        )
        if abierto:
            enrich_checklist_out(abierto)
        if _preparacion_valida(db, id_act) is not None:
            return {
                "puede": True,
                "motivo": None,
                "checklist_abierto": abierto,
                "checklist_requerido": "Preparacion",
            }
        return {
            "puede": False,
            "motivo": "Debe completar y cerrar el checklist de preparación antes de asignar",
            "checklist_abierto": abierto,
            "checklist_requerido": "Preparacion",
        }

    abierto = (
        db.query(Checklist)
        .options(joinedload(Checklist.pasos), joinedload(Checklist.plantilla))
        .filter(
            Checklist.id_act == id_act,
            Checklist.proposito == "Reasignacion",
            Checklist.estado == "Abierto",
        )
        .first()
    )
    if abierto:
        enrich_checklist_out(abierto)
    if _reasignacion_valida(db, id_act, asig_vigente.id_asig) is not None:
        return {
            "puede": True,
            "motivo": None,
            "checklist_abierto": abierto,
            "checklist_requerido": "Reasignacion",
        }
    return {
        "puede": False,
        "motivo": "Debe completar y cerrar el checklist de reasignación antes de reasignar",
        "checklist_abierto": abierto,
        "checklist_requerido": "Reasignacion",
    }


def validar_gate_asignacion(db: Session, activo: ActivoTi) -> None:
    """Lanza HTTPException si el activo computacional no cumple el checklist requerido."""
    if activo.tipo != "Equipo Computo":
        return

    eleg = evaluar_elegibilidad(db, activo.id_act)
    if not eleg["puede"]:
        raise HTTPException(status_code=400, detail=eleg["motivo"])
