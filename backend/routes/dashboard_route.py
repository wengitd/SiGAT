from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import case, extract, func
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database import get_db
from models.activo_ti_model import (
    ActivoTi,
    Disponibilidad,
    EdicionSO,
    EquipoComputo,
    FamiliaSO,
    VersionSO,
)
from models.emp_lic_model import EmpLic
from models.licencia_model import Licencia, ProveedorLicencia
from models.tipo_estado_model import TipoEstado
from schemas.dashboard_schema import ResumenDashboard

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]


def _contar_activos(db: Session, anio: int) -> dict:
    periferico = (
        db.query(func.count(ActivoTi.id_act))
        .filter(ActivoTi.tipo == "periferico")
        .scalar()
    )
    equipo_computo = (
        db.query(func.count(ActivoTi.id_act))
        .filter(ActivoTi.tipo == "equipo_computo")
        .scalar()
    )
    adquiridos_anio = (
        db.query(func.count(ActivoTi.id_act))
        .filter(extract("year", ActivoTi.fecha_recep) == anio)
        .scalar()
    )
    return {
        "periferico": periferico or 0,
        "equipo_computo": equipo_computo or 0,
        "adquiridos_anio": adquiridos_anio or 0,
    }


def _licencias_por_proveedor(db: Session):
    """Licencias vigentes (EmpLic) agrupadas por proveedor."""
    filas = (
        db.query(ProveedorLicencia.nombre, func.count(EmpLic.id_lic))
        .join(Licencia, Licencia.id_prov == ProveedorLicencia.id_prov)
        .join(EmpLic, EmpLic.id_lic == Licencia.id_lic)
        .group_by(ProveedorLicencia.nombre)
        .order_by(ProveedorLicencia.nombre)
        .all()
    )
    return [{"proveedor": nombre, "total": total} for nombre, total in filas]


def _sistemas_operativos(db: Session):
    filas = (
        db.query(FamiliaSO.nombre, func.count(EquipoComputo.id_act))
        .join(EdicionSO, EdicionSO.id_edicion_so == EquipoComputo.id_edicion_so)
        .join(VersionSO, VersionSO.id_ver_so == EdicionSO.id_ver_so)
        .join(FamiliaSO, FamiliaSO.id_fam_so == VersionSO.id_fam_so)
        .group_by(FamiliaSO.nombre)
        .order_by(func.count(EquipoComputo.id_act).desc())
        .all()
    )
    return [{"familia": nombre, "total": total} for nombre, total in filas]


def _activos_por_estado(db: Session):
    dispo_baja = (
        db.query(Disponibilidad)
        .filter(func.lower(Disponibilidad.nombre) == "de_baja")
        .first()
    )
    id_dispo_baja = dispo_baja.id_dispo if dispo_baja else -1

    etiqueta = case(
        (ActivoTi.id_dispo == id_dispo_baja, "De baja"),
        else_=TipoEstado.nombre,
    ).label("estado")

    filas = (
        db.query(etiqueta, func.count(ActivoTi.id_act))
        .join(TipoEstado, TipoEstado.id_tipoe == ActivoTi.id_tipoe)
        .group_by(etiqueta)
        .all()
    )
    return [{"estado": estado, "total": total} for estado, total in filas]


def _licencias_por_mes(db: Session, anio: int, proveedores: list[str]):
    filas = (
        db.query(
            ProveedorLicencia.nombre,
            extract("month", EmpLic.fecha_asignacion),
            func.count(EmpLic.id_lic),
        )
        .join(Licencia, Licencia.id_prov == ProveedorLicencia.id_prov)
        .join(EmpLic, EmpLic.id_lic == Licencia.id_lic)
        .filter(extract("year", EmpLic.fecha_asignacion) == anio)
        .group_by(ProveedorLicencia.nombre, extract("month", EmpLic.fecha_asignacion))
        .all()
    )

    series_por_proveedor = {p: [0] * 12 for p in proveedores}
    for nombre, mes, total in filas:
        if nombre in series_por_proveedor and mes:
            series_por_proveedor[nombre][int(mes) - 1] = total

    return {
        "labels": MESES,
        "series": [
            {"proveedor": p, "data": series_por_proveedor[p]} for p in proveedores
        ],
    }


@router.get("/resumen", response_model=ResumenDashboard)
def resumen(
    anio: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Datos agregados para el Dashboard: totales de activos, licencias por
    proveedor, sistemas operativos, activos por estado y licencias por mes."""
    anio_consulta = anio or date.today().year

    licencias_totales = _licencias_por_proveedor(db)
    proveedores = [l["proveedor"] for l in licencias_totales]

    return {
        "activos": _contar_activos(db, anio_consulta),
        "licencias_totales": licencias_totales,
        "sistemas_operativos": _sistemas_operativos(db),
        "activos_por_estado": _activos_por_estado(db),
        "licencias_por_mes": _licencias_por_mes(db, anio_consulta, proveedores),
    }
