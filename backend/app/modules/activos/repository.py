"""Acceso a datos del dominio Activos TI."""

import re

from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.modules.activos.models import (
    ActivoTi,
    EdicionSO,
    EquipoComputo,
    FamiliaSO,
    Marca,
    Modelo,
    Periferico,
    TipoEquipo,
    TipoPeriferico,
    VersionSO,
)
from app.modules.asignaciones.models import Asignacion
from app.modules.catalogos.models_tipo_estado import TipoEstado
from app.modules.empleados.models import Empleado
from app.modules.facturas.models import Factura
from app.shared.eliminacion import activo_tiene_historial

SUBTIPOS = {"Equipo Computo": EquipoComputo, "Periferico": Periferico}


def _normalizar_mac_busqueda(mac: str) -> str:
    """Quita separadores y deja solo hex en minúsculas para comparar MACs."""
    return re.sub(r"[^0-9A-Fa-f]", "", mac or "").lower()


def to_dict(obj) -> dict:
    """Convierte un objeto SQLAlchemy en diccionario por columnas."""
    if obj is None:
        return {}
    return {col.name: getattr(obj, col.name) for col in obj.__table__.columns}


def get_activo(db: Session, id_act: int) -> ActivoTi | None:
    return db.query(ActivoTi).filter(ActivoTi.id_act == id_act).first()


def list_activos(
    db: Session,
    *,
    tipo: str | None = None,
    id_dispo: int | None = None,
    id_tipoe: int | None = None,
    mac: str | None = None,
) -> list[ActivoTi]:
    q = db.query(ActivoTi)

    if tipo:
        q = q.filter(ActivoTi.tipo == tipo)
    if id_dispo is not None:
        q = q.filter(ActivoTi.id_dispo == id_dispo)
    if id_tipoe is not None:
        q = q.filter(ActivoTi.id_tipoe == id_tipoe)

    mac_norm = _normalizar_mac_busqueda(mac) if mac else ""
    if mac_norm:
        eth_norm = func.replace(func.lower(EquipoComputo.mac_ethernet), ":", "")
        wifi_norm = func.replace(func.lower(EquipoComputo.mac_wifi), ":", "")
        q = q.join(EquipoComputo, EquipoComputo.id_act == ActivoTi.id_act).filter(
            or_(
                eth_norm.contains(mac_norm),
                wifi_norm.contains(mac_norm),
            )
        )

    return q.all()


def existe_serie(db: Session, num_serie: str, exclude_id: int | None = None) -> bool:
    q = db.query(ActivoTi.id_act).filter(ActivoTi.num_serie == num_serie)
    if exclude_id is not None:
        q = q.filter(ActivoTi.id_act != exclude_id)
    return q.first() is not None


def sugerencias_cpu(db: Session) -> list[str]:
    filas = (
        db.query(EquipoComputo.cpu)
        .filter(EquipoComputo.cpu.isnot(None), EquipoComputo.cpu != "")
        .distinct()
        .order_by(EquipoComputo.cpu)
        .all()
    )
    return [f[0] for f in filas]


def sugerencias_u_medida(db: Session) -> list[str]:
    filas = (
        db.query(Periferico.u_medida)
        .filter(Periferico.u_medida.isnot(None), Periferico.u_medida != "")
        .distinct()
        .order_by(Periferico.u_medida)
        .all()
    )
    return [f[0] for f in filas]


def build_activo_data(activo_model: ActivoTi, db: Session) -> dict:
    """Construye dict completo del activo (padre + subtipo + enriquecimiento)."""
    data = to_dict(activo_model)
    modelo_subtipo = SUBTIPOS.get(activo_model.tipo)

    if modelo_subtipo:
        sub = (
            db.query(modelo_subtipo)
            .filter(modelo_subtipo.id_act == activo_model.id_act)
            .first()
        )
        if sub:
            data.update(to_dict(sub))

            if hasattr(sub, "id_edicion_so") and sub.id_edicion_so is not None:
                edicion = (
                    db.query(EdicionSO)
                    .filter(EdicionSO.id_edicion_so == sub.id_edicion_so)
                    .first()
                )
                if edicion:
                    version = (
                        db.query(VersionSO)
                        .filter(VersionSO.id_ver_so == edicion.id_ver_so)
                        .first()
                    )
                    familia = (
                        db.query(FamiliaSO)
                        .filter(FamiliaSO.id_fam_so == version.id_fam_so)
                        .first()
                        if version
                        else None
                    )
                    data["detalles_so"] = {
                        "familia": familia.nombre if familia else None,
                        "version": version.nombre if version else None,
                        "edicion": edicion.nombre,
                    }
                    partes = [
                        p
                        for p in (
                            familia.nombre if familia else None,
                            version.nombre if version else None,
                            edicion.nombre,
                        )
                        if p
                    ]
                    data["nombre_so"] = " ".join(partes) if partes else None

            if hasattr(sub, "id_tipoeq") and sub.id_tipoeq is not None:
                tipoeq = (
                    db.query(TipoEquipo)
                    .filter(TipoEquipo.id_tipoeq == sub.id_tipoeq)
                    .first()
                )
                if tipoeq:
                    data["nombre_tipoeq"] = tipoeq.nombre

            if hasattr(sub, "id_tipoper") and sub.id_tipoper is not None:
                tipoper = (
                    db.query(TipoPeriferico)
                    .filter(TipoPeriferico.id_tipoper == sub.id_tipoper)
                    .first()
                )
                if tipoper:
                    data["nombre_tipoper"] = tipoper.nombre

    if activo_model.id_modelo is not None:
        modelo = (
            db.query(Modelo).filter(Modelo.id_modelo == activo_model.id_modelo).first()
        )
        if modelo:
            data["nombre_modelo"] = modelo.nombre
            marca = db.query(Marca).filter(Marca.id_marca == modelo.id_marca).first()
            if marca:
                data["nombre_marca"] = marca.nombre

    estado = (
        db.query(TipoEstado)
        .filter(TipoEstado.id_tipoe == activo_model.id_tipoe)
        .first()
    )
    if estado:
        data["nombre_estado"] = estado.nombre

    asignacion = (
        db.query(Asignacion)
        .filter(Asignacion.id_act == activo_model.id_act, Asignacion.fecha_dev == None)
        .order_by(Asignacion.fecha_entr.desc())
        .first()
    )
    data["tiene_acta_entr"] = False
    if asignacion:
        empleado = (
            db.query(Empleado).filter(Empleado.id_emp == asignacion.id_emp).first()
        )
        if empleado:
            data["empleado_asignado"] = empleado.nombre
            data["id_asig_actual"] = asignacion.id_asig
            data["tiene_acta_entr"] = bool(asignacion.ruta_acta_entr)

    from app.modules.activos.models import Disponibilidad

    dispo = (
        db.query(Disponibilidad)
        .filter(Disponibilidad.id_dispo == activo_model.id_dispo)
        .first()
    )
    if dispo:
        data["nombre_dispo"] = dispo.nombre
        data["dispo_color"] = dispo.color or "default"

    if activo_model.id_fact is not None:
        factura = (
            db.query(Factura).filter(Factura.id_fact == activo_model.id_fact).first()
        )
        if factura:
            data["ruta_pdf_fact"] = factura.ruta_pdf_fact
            data["fecha_em_fact"] = factura.fecha_em

    data["puede_eliminar"] = not activo_tiene_historial(db, activo_model.id_act)
    return data


def split_payload_por_model(payload_dict: dict, model_class) -> dict:
    columnas = {col.name for col in model_class.__table__.columns}
    return {k: v for k, v in payload_dict.items() if k in columnas}


def delete_subtipos(db: Session, id_act: int) -> None:
    db.query(EquipoComputo).filter(EquipoComputo.id_act == id_act).delete(
        synchronize_session=False
    )
    db.query(Periferico).filter(Periferico.id_act == id_act).delete(
        synchronize_session=False
    )
    db.flush()
