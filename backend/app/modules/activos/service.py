"""Lógica de negocio del dominio Activos TI."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.activos import repository as repo
from app.modules.activos.models import (
    ActivoTi,
    Disponibilidad,
    EdicionSO,
    TipoEquipo,
    TipoPeriferico,
)
from app.modules.activos.schemas import ActivoCreate, ActivoUpdate
from app.modules.asignaciones.models import Asignacion
from app.modules.catalogos.models_tipo_estado import TipoEstado
from app.modules.facturas.models import Factura
from app.modules.historial.models import HistorialEstado
from app.shared.eliminacion import activo_tiene_historial

CAUSA_CAMBIO_CONDICION = "Cambio de condición"

REGLAS_INCOMPATIBLES = {
    "bueno": {"de baja", "mantencion"},
    "regular": set(),
    "malo": set(),
}


def validar_dispo_estado(id_dispo: int, id_tipoe: int, db: Session) -> None:
    """Regla de negocio: estado vs disponibilidad incompatible."""
    dispo = db.query(Disponibilidad).filter(Disponibilidad.id_dispo == id_dispo).first()
    estado = db.query(TipoEstado).filter(TipoEstado.id_tipoe == id_tipoe).first()

    if not dispo or not estado:
        return

    no_permitidas = REGLAS_INCOMPATIBLES.get(estado.nombre.lower(), set())
    if dispo.nombre.lower() in no_permitidas:
        raise HTTPException(
            status_code=400,
            detail=f"Un activo '{estado.nombre}' no puede estar '{dispo.nombre}'",
        )


def validar_asignado_con_empleado(
    id_dispo: int,
    db: Session,
    *,
    id_act: int | None = None,
) -> None:
    """Un activo no puede quedar 'asignado' sin una asignación vigente."""
    dispo = db.query(Disponibilidad).filter(Disponibilidad.id_dispo == id_dispo).first()
    if not dispo or dispo.nombre.lower() != "asignado":
        return

    if id_act is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Un activo no puede crearse como asignado. "
                "Use el flujo de asignación con un empleado."
            ),
        )

    abierta = (
        db.query(Asignacion)
        .filter(Asignacion.id_act == id_act, Asignacion.fecha_dev.is_(None))
        .first()
    )
    if abierta is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Un activo no puede quedar asignado sin un empleado. "
                "Use el flujo de asignación."
            ),
        )


def commit_or_rollback(db: Session) -> None:
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise


def listar_activos(
    db: Session,
    *,
    tipo: str | None = None,
    id_dispo: int | None = None,
    id_tipoe: int | None = None,
    mac: str | None = None,
) -> list[dict]:
    activos = repo.list_activos(
        db, tipo=tipo, id_dispo=id_dispo, id_tipoe=id_tipoe, mac=mac
    )
    return [repo.build_activo_data(a, db) for a in activos]


def obtener_activo(db: Session, id_act: int) -> dict:
    activo = repo.get_activo(db, id_act)
    if activo is None:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return repo.build_activo_data(activo, db)


def check_existe_serie(db: Session, num_serie: str) -> dict:
    serie = (num_serie or "").strip()
    if not serie:
        return {"existe": False}
    return {"existe": repo.existe_serie(db, serie)}


def crear_activo(db: Session, payload: ActivoCreate) -> dict:
    if payload.id_fact is not None:
        if db.query(Factura).filter(Factura.id_fact == payload.id_fact).first() is None:
            raise HTTPException(status_code=400, detail="Factura no existe")

    if payload.id_modelo is not None:
        from app.modules.activos.models import Modelo

        if db.query(Modelo).filter(Modelo.id_modelo == payload.id_modelo).first() is None:
            raise HTTPException(status_code=400, detail="Modelo no existe")

    if (
        db.query(TipoEstado).filter(TipoEstado.id_tipoe == payload.id_tipoe).first()
        is None
    ):
        raise HTTPException(status_code=404, detail="Tipo estado no encontrado")

    if payload.tipo == "Equipo Computo":
        if payload.id_tipoeq is not None:
            if (
                db.query(TipoEquipo)
                .filter(TipoEquipo.id_tipoeq == payload.id_tipoeq)
                .first()
                is None
            ):
                raise HTTPException(status_code=400, detail="Tipo de equipo no existe")
        if payload.id_edicion_so is not None:
            if (
                db.query(EdicionSO)
                .filter(EdicionSO.id_edicion_so == payload.id_edicion_so)
                .first()
                is None
            ):
                raise HTTPException(
                    status_code=400, detail="Edición de sistema operativo no existe"
                )
    elif payload.tipo == "Periferico":
        if payload.id_tipoper is not None:
            if (
                db.query(TipoPeriferico)
                .filter(TipoPeriferico.id_tipoper == payload.id_tipoper)
                .first()
                is None
            ):
                raise HTTPException(
                    status_code=400, detail="Tipo de periférico no existe"
                )

    validar_dispo_estado(payload.id_dispo, payload.id_tipoe, db)
    validar_asignado_con_empleado(payload.id_dispo, db)

    if payload.num_serie and repo.existe_serie(db, payload.num_serie):
        raise HTTPException(
            status_code=400,
            detail="Ya existe un activo con ese número de serie",
        )

    modelo_subtipo = repo.SUBTIPOS.get(payload.tipo)
    if modelo_subtipo is None:
        raise HTTPException(
            status_code=400, detail=f"Tipo no soportado: {payload.tipo}"
        )

    payload_dict = payload.model_dump()
    datos_activo = repo.split_payload_por_model(payload_dict, ActivoTi)
    activo = ActivoTi(**datos_activo)
    db.add(activo)
    db.flush()

    datos_subtipo = repo.split_payload_por_model(payload_dict, modelo_subtipo)
    datos_subtipo["id_act"] = activo.id_act
    db.add(modelo_subtipo(**datos_subtipo))

    commit_or_rollback(db)
    db.refresh(activo)
    return repo.build_activo_data(activo, db)


def actualizar_activo(
    db: Session,
    id_act: int,
    payload: ActivoUpdate,
    *,
    id_usuario: int | None = None,
) -> dict:
    from app.modules.activos.models import Modelo

    activo = repo.get_activo(db, id_act)
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    if payload.num_serie is not None and payload.num_serie != "":
        if repo.existe_serie(db, payload.num_serie, exclude_id=id_act):
            raise HTTPException(
                status_code=400,
                detail="Ya existe un activo con ese número de serie",
            )

    if payload.id_modelo is not None:
        if db.query(Modelo).filter(Modelo.id_modelo == payload.id_modelo).first() is None:
            raise HTTPException(status_code=400, detail="Modelo no existe")

    if activo.tipo == "Equipo Computo":
        if payload.id_tipoeq is not None:
            if (
                db.query(TipoEquipo)
                .filter(TipoEquipo.id_tipoeq == payload.id_tipoeq)
                .first()
                is None
            ):
                raise HTTPException(status_code=400, detail="Tipo de equipo no existe")
        if payload.id_edicion_so is not None:
            if (
                db.query(EdicionSO)
                .filter(EdicionSO.id_edicion_so == payload.id_edicion_so)
                .first()
                is None
            ):
                raise HTTPException(
                    status_code=400, detail="Edición de sistema operativo no existe"
                )
    elif activo.tipo == "Periferico":
        if payload.id_tipoper is not None:
            if (
                db.query(TipoPeriferico)
                .filter(TipoPeriferico.id_tipoper == payload.id_tipoper)
                .first()
                is None
            ):
                raise HTTPException(
                    status_code=400, detail="Tipo de periférico no existe"
                )

    id_tipoe_anterior = activo.id_tipoe
    payload_dict = payload.model_dump(exclude_unset=True)
    payload_dict.pop("causa", None)

    for k, v in repo.split_payload_por_model(payload_dict, ActivoTi).items():
        setattr(activo, k, v)

    modelo_subtipo = repo.SUBTIPOS.get(activo.tipo)
    if modelo_subtipo:
        sub = db.query(modelo_subtipo).filter(modelo_subtipo.id_act == id_act).first()
        if sub:
            for k, v in repo.split_payload_por_model(payload_dict, modelo_subtipo).items():
                setattr(sub, k, v)

    nuevo_id_dispo = (
        payload.id_dispo if payload.id_dispo is not None else activo.id_dispo
    )
    nuevo_id_tipoe = (
        payload.id_tipoe if payload.id_tipoe is not None else activo.id_tipoe
    )
    validar_dispo_estado(nuevo_id_dispo, nuevo_id_tipoe, db)
    validar_asignado_con_empleado(nuevo_id_dispo, db, id_act=id_act)

    if payload.id_tipoe is not None and payload.id_tipoe != id_tipoe_anterior:
        causa = (payload.causa or "").strip() or CAUSA_CAMBIO_CONDICION
        db.add(
            HistorialEstado(
                id_act=id_act,
                id_tipoe=payload.id_tipoe,
                causa=causa[:50],
                id_usuario_reg=id_usuario,
            )
        )

    commit_or_rollback(db)
    return repo.build_activo_data(activo, db)


def eliminar_activo(db: Session, id_act: int) -> None:
    activo = repo.get_activo(db, id_act)
    if activo is None:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    if activo_tiene_historial(db, id_act):
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar: el activo tiene historial o asociaciones",
        )

    repo.delete_subtipos(db, id_act)
    db.delete(activo)
    commit_or_rollback(db)
