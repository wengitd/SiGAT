"""Reglas de asignación empleado–versión de licencia."""

from datetime import date

from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import AppError, NotFoundError
from app.modules.empleados.models import Empleado
from app.modules.licencias.models import VersionLicencia
from app.modules.licencias.models_emp_lic import EmpLic
from app.modules.licencias.schemas_emp_lic import (
    EmpleadoLicenciaCreate,
    EmpleadoLicenciaDetalleOut,
)


def _enriquecer(el: EmpLic, ver: VersionLicencia) -> EmpleadoLicenciaDetalleOut:
    """Arma la respuesta con nombres de proveedor y versión."""
    return EmpleadoLicenciaDetalleOut(
        id_emp=el.id_emp,
        id_ver=el.id_ver,
        id_prov=ver.id_prov,
        proveedor=ver.proveedor.nombre if ver.proveedor else "N/A",
        version=ver.nombre,
        fecha_asignacion=el.fecha_asignacion,
    )


def listar_asignaciones(db: Session, id_emp: int) -> list[EmpleadoLicenciaDetalleOut]:
    """Lista las versiones asignadas a un empleado, con proveedor."""
    emp = db.query(Empleado).filter(Empleado.id_emp == id_emp).first()
    if emp is None:
        raise NotFoundError("Empleado no encontrado")

    emp_lics = db.query(EmpLic).filter(EmpLic.id_emp == id_emp).all()
    if not emp_lics:
        return []

    ids_ver = [el.id_ver for el in emp_lics]
    versiones = (
        db.query(VersionLicencia)
        .options(joinedload(VersionLicencia.proveedor))
        .filter(VersionLicencia.id_ver.in_(ids_ver))
        .all()
    )
    ver_por_id = {ver.id_ver: ver for ver in versiones}

    return [
        _enriquecer(el, ver_por_id[el.id_ver])
        for el in emp_lics
        if el.id_ver in ver_por_id
    ]


def _proveedor_ya_asignado(db: Session, id_emp: int, id_prov: int) -> bool:
    """True si el empleado ya tiene alguna versión de ese proveedor."""
    return (
        db.query(EmpLic)
        .join(VersionLicencia, VersionLicencia.id_ver == EmpLic.id_ver)
        .filter(EmpLic.id_emp == id_emp, VersionLicencia.id_prov == id_prov)
        .first()
        is not None
    )


def asignar(db: Session, payload: EmpleadoLicenciaCreate) -> EmpLic:
    """Vincula una versión de licencia al empleado. Un proveedor por empleado."""
    emp = db.query(Empleado).filter(Empleado.id_emp == payload.id_emp).first()
    if emp is None:
        raise AppError("Empleado no existe")

    ver = (
        db.query(VersionLicencia)
        .options(joinedload(VersionLicencia.proveedor))
        .filter(VersionLicencia.id_ver == payload.id_ver)
        .first()
    )
    if ver is None:
        raise AppError("Versión de licencia no existe")

    if _proveedor_ya_asignado(db, payload.id_emp, ver.id_prov):
        raise AppError("Este empleado ya tiene una licencia de este proveedor")

    nuevo = EmpLic(
        id_emp=payload.id_emp,
        id_ver=payload.id_ver,
        fecha_asignacion=date.today(),
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def desasignar(db: Session, id_emp: int, id_ver: int) -> None:
    """Quita el vínculo empleado–versión (hard delete)."""
    eli = (
        db.query(EmpLic)
        .filter(EmpLic.id_emp == id_emp, EmpLic.id_ver == id_ver)
        .first()
    )
    if eli is None:
        raise NotFoundError("No encontrada")

    db.delete(eli)
    db.commit()
