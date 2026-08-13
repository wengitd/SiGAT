"""Helpers para decidir hard delete vs soft delete / bloqueo."""

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.modules.asignaciones.models import Asignacion
from app.modules.checklist.models import Checklist
from app.modules.historial.models import HistorialEstado
from app.modules.licencias.models_emp_lic import EmpLic
from app.modules.solicitudes_baja.models import SolicitudBaja


def activo_tiene_historial(db: Session, id_act: int) -> bool:
    """True si el activo tiene asignaciones, estados, checklists o solicitudes de baja."""
    if db.query(Asignacion.id_asig).filter(Asignacion.id_act == id_act).first():
        return True
    if (
        db.query(HistorialEstado.id_hes)
        .filter(HistorialEstado.id_act == id_act)
        .first()
    ):
        return True
    if db.query(Checklist.id_check).filter(Checklist.id_act == id_act).first():
        return True
    if (
        db.query(SolicitudBaja.id_solbaja)
        .filter(SolicitudBaja.id_act == id_act)
        .first()
    ):
        return True
    return False


def usuario_tiene_asociaciones(db: Session, id_usuario: int) -> bool:
    """True si el usuario aparece en historial operativo (no se puede hard-delete)."""
    if (
        db.query(Asignacion.id_asig)
        .filter(Asignacion.id_usuario_reg == id_usuario)
        .first()
    ):
        return True
    if (
        db.query(HistorialEstado.id_hes)
        .filter(HistorialEstado.id_usuario_reg == id_usuario)
        .first()
    ):
        return True
    if (
        db.query(Checklist.id_check)
        .filter(Checklist.id_usuario == id_usuario)
        .first()
    ):
        return True
    if (
        db.query(SolicitudBaja.id_solbaja)
        .filter(
            or_(
                SolicitudBaja.id_usuario_sol == id_usuario,
                SolicitudBaja.id_usuario_aprob == id_usuario,
                SolicitudBaja.id_usuario_borrado == id_usuario,
            )
        )
        .first()
    ):
        return True
    return False


def empleado_tiene_asociaciones(db: Session, id_emp: int) -> bool:
    """True si el empleado tiene asignaciones o licencias (no se puede hard-delete)."""
    if db.query(Asignacion.id_asig).filter(Asignacion.id_emp == id_emp).first():
        return True
    if db.query(EmpLic.id_emp).filter(EmpLic.id_emp == id_emp).first():
        return True
    return False
