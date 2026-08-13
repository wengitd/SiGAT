"""Agregaciones SQL del dashboard. El filtro de año es único y se reutiliza."""

from datetime import date

from sqlalchemy import case, extract, func, or_
from sqlalchemy.orm import Session

from app.modules.activos.models import (
    ActivoTi,
    Disponibilidad,
    EquipoComputo,
    Periferico,
    TipoEquipo,
    TipoPeriferico,
)
from app.modules.catalogos.models_tipo_estado import TipoEstado
from app.modules.licencias.models import ProveedorLicencia, VersionLicencia
from app.modules.licencias.models_emp_lic import EmpLic

SIN_TIPO = "Sin tipo"


def filtro_anio_activo(anio: int):
    """Activos del periodo: recibidos en ese año.

    Sin fecha de recepción no coinciden con ningún YEAR(); se cuentan en el
    año actual para que el inventario recién creado aparezca en el dashboard.
    """
    recibido_en_anio = ActivoTi.fecha_recep.between(date(anio, 1, 1), date(anio, 12, 31))
    if anio == date.today().year:
        return or_(recibido_en_anio, ActivoTi.fecha_recep.is_(None))
    return recibido_en_anio


def filtro_anio_licencia(anio: int):
    """Asignaciones de licencia hechas en el año del periodo."""
    return extract("year", EmpLic.fecha_asignacion) == anio


def _contar_activos(
    db: Session,
    anio: int,
    *,
    tipo: str | None = None,
    nombre_dispo: str | None = None,
) -> int:
    consulta = db.query(func.count(ActivoTi.id_act)).filter(filtro_anio_activo(anio))
    if tipo:
        consulta = consulta.filter(ActivoTi.tipo == tipo)
    if nombre_dispo:
        consulta = consulta.join(
            Disponibilidad, Disponibilidad.id_dispo == ActivoTi.id_dispo
        ).filter(func.lower(Disponibilidad.nombre) == nombre_dispo)
    return consulta.scalar() or 0


def contar_kpis(db: Session, anio: int) -> dict:
    """Totales de activos del año: inventario, equipos y bajas."""
    return {
        "total": _contar_activos(db, anio),
        "equipos_disponibles": _contar_activos(
            db, anio, tipo="Equipo Computo", nombre_dispo="disponible"
        ),
        "equipos_asignados": _contar_activos(
            db, anio, tipo="Equipo Computo", nombre_dispo="asignado"
        ),
        "dados_de_baja": _contar_activos(db, anio, nombre_dispo="de baja"),
    }


def activos_por_tipo(db: Session, anio: int) -> list[dict]:
    """Distribución por subtipo de catálogo (Notebook, Monitor, etc.)."""
    equipos = (
        db.query(
            func.coalesce(TipoEquipo.nombre, SIN_TIPO),
            func.count(EquipoComputo.id_act),
        )
        .select_from(EquipoComputo)
        .join(ActivoTi, ActivoTi.id_act == EquipoComputo.id_act)
        .outerjoin(TipoEquipo, TipoEquipo.id_tipoeq == EquipoComputo.id_tipoeq)
        .filter(filtro_anio_activo(anio))
        .group_by(func.coalesce(TipoEquipo.nombre, SIN_TIPO))
        .all()
    )
    perifericos = (
        db.query(
            func.coalesce(TipoPeriferico.nombre, SIN_TIPO),
            func.count(Periferico.id_act),
        )
        .select_from(Periferico)
        .join(ActivoTi, ActivoTi.id_act == Periferico.id_act)
        .outerjoin(TipoPeriferico, TipoPeriferico.id_tipoper == Periferico.id_tipoper)
        .filter(filtro_anio_activo(anio))
        .group_by(func.coalesce(TipoPeriferico.nombre, SIN_TIPO))
        .all()
    )

    acumulado: dict[str, int] = {}
    for nombre, total in (*equipos, *perifericos):
        acumulado[nombre] = acumulado.get(nombre, 0) + (total or 0)

    return [
        {"tipo": nombre, "total": total}
        for nombre, total in sorted(
            acumulado.items(), key=lambda item: (-item[1], item[0])
        )
    ]


def activos_por_antiguedad(db: Session, anio: int) -> list[dict]:
    """Conteo por rango de edad a partir de fecha_recep (omite fechas nulas)."""
    anios = extract("year", func.age(func.current_date(), ActivoTi.fecha_recep))
    rango = case(
        (anios < 3, "Menos de 3 años"),
        (anios < 5, "Entre 3 a 5 años"),
        (anios < 7, "Entre 5 a 7 años"),
        else_="Más de 7 años",
    ).label("rango")

    filas = (
        db.query(rango, func.count(ActivoTi.id_act))
        .filter(filtro_anio_activo(anio), ActivoTi.fecha_recep.isnot(None))
        .group_by(rango)
        .all()
    )
    return [{"rango": nombre, "total": total or 0} for nombre, total in filas]


def contar_equipos_computo(db: Session, anio: int) -> int:
    return _contar_activos(db, anio, tipo="Equipo Computo")


def licencias_por_tipo(db: Session, anio: int) -> list[dict]:
    """Asignaciones del año por proveedor, con el total de equipos de cómputo."""
    total_equipos = contar_equipos_computo(db, anio)
    asignadas = dict(
        db.query(ProveedorLicencia.nombre, func.count(EmpLic.id_ver))
        .join(VersionLicencia, VersionLicencia.id_prov == ProveedorLicencia.id_prov)
        .join(EmpLic, EmpLic.id_ver == VersionLicencia.id_ver)
        .filter(filtro_anio_licencia(anio))
        .group_by(ProveedorLicencia.nombre)
        .all()
    )
    proveedores = (
        db.query(ProveedorLicencia.nombre)
        .order_by(ProveedorLicencia.nombre)
        .all()
    )
    return [
        {
            "tipo": nombre,
            "asignadas": asignadas.get(nombre, 0) or 0,
            "total_equipos_computo": total_equipos,
        }
        for (nombre,) in proveedores
    ]


def activos_por_estado(db: Session, anio: int) -> list[dict]:
    """Estado técnico; disponibilidad De Baja se etiqueta aparte."""
    dispo_baja = (
        db.query(Disponibilidad)
        .filter(func.lower(Disponibilidad.nombre) == "de baja")
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
        .filter(filtro_anio_activo(anio))
        .group_by(etiqueta)
        .all()
    )
    return [{"estado": estado, "total": total or 0} for estado, total in filas]
