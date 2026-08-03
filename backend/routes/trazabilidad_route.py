from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user
from database import get_db

from models.activo_ti_model import (
    ActivoTi,
    EquipoComputo,
    Periferico,
    Modelo,
    Marca,
    TipoEquipo,
    TipoPeriferico,
    Disponibilidad,
)
from models.tipo_estado_model import TipoEstado
from models.empleado_model import Empleado, Cargo, Planta
from models.usuario_sistema_model import UsuarioSistema
from models.dpto_model import Departamento, SubArea
from models.asignacion_model import Asignacion
from models.historial_estado_model import HistorialEstado
from models.emp_lic_model import EmpLic
from models.licencia_model import Licencia, ProveedorLicencia, VersionLicencia
from models.checklist_model import Checklist
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/trazabilidad", tags=["Trazabilidad"])


def _get_activo_summary(activo: ActivoTi, db: Session) -> dict:
    modelo = db.query(Modelo).filter(Modelo.id_modelo == activo.id_modelo).first() if activo.id_modelo else None
    marca = db.query(Marca).filter(Marca.id_marca == modelo.id_marca).first() if modelo else None
    estado = db.query(TipoEstado).filter(TipoEstado.id_tipoe == activo.id_tipoe).first()
    dispo = db.query(Disponibilidad).filter(Disponibilidad.id_dispo == activo.id_dispo).first()

    nombre_tipo = None
    if activo.tipo == "equipo_computo":
        eq = db.query(EquipoComputo).filter(EquipoComputo.id_act == activo.id_act).first()
        if eq and eq.id_tipoeq:
            teq = db.query(TipoEquipo).filter(TipoEquipo.id_tipoeq == eq.id_tipoeq).first()
            if teq:
                nombre_tipo = teq.nombre
    elif activo.tipo == "periferico":
        per = db.query(Periferico).filter(Periferico.id_act == activo.id_act).first()
        if per and per.id_tipoper:
            tper = db.query(TipoPeriferico).filter(TipoPeriferico.id_tipoper == per.id_tipoper).first()
            if tper:
                nombre_tipo = tper.nombre

    # Empleado asignado actualmente
    asig_actual = (
        db.query(Asignacion)
        .filter(Asignacion.id_act == activo.id_act, Asignacion.fecha_dev.is_(None))
        .first()
    )
    empleado_asignado = None
    if asig_actual:
        emp = db.query(Empleado).filter(Empleado.id_emp == asig_actual.id_emp).first()
        if emp:
            empleado_asignado = emp.nombre

    return {
        "id_act": activo.id_act,
        "num_serie": activo.num_serie or "S/N",
        "tipo": activo.tipo,
        "origen": activo.origen,
        "fecha_recep": activo.fecha_recep,
        "nombre_marca": marca.nombre if marca else "N/A",
        "nombre_modelo": modelo.nombre if modelo else "N/A",
        "nombre_subtipo": nombre_tipo or ("Computacional" if activo.tipo == "equipo_computo" else "Periférico"),
        "nombre_estado": estado.nombre if estado else "N/A",
        "nombre_dispo": dispo.nombre if dispo else "N/A",
        "dispo_color": dispo.color if dispo else "default",
        "empleado_asignado": empleado_asignado,
    }


def _get_usuario_name(id_usuario: int | None, db: Session) -> str | None:
    if not id_usuario:
        return None
    user = db.query(UsuarioSistema).filter(UsuarioSistema.id_usuario == id_usuario).first()
    return user.nombre if user else None


@router.get("/activo/{id_act}")
def obtener_trazabilidad_activo(
    id_act: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    activo = db.query(ActivoTi).filter(ActivoTi.id_act == id_act).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    resumen_activo = _get_activo_summary(activo, db)

    # 1. Historial de asignaciones
    asignaciones_raw = (
        db.query(Asignacion)
        .filter(Asignacion.id_act == id_act)
        .order_by(Asignacion.fecha_entr.desc())
        .all()
    )

    historial_asignaciones = []
    for asig in asignaciones_raw:
        emp = db.query(Empleado).filter(Empleado.id_emp == asig.id_emp).first()
        cargo = db.query(Cargo).filter(Cargo.id_cargo == emp.id_cargo).first() if emp else None
        dpto = db.query(Departamento).filter(Departamento.id_dpto == emp.id_dpto).first() if emp and emp.id_dpto else None

        historial_asignaciones.append({
            "id_asig": asig.id_asig,
            "fecha_entr": asig.fecha_entr,
            "fecha_dev": asig.fecha_dev,
            "ruta_acta_entr": asig.ruta_acta_entr,
            "activo_actual": asig.fecha_dev is None,
            "empleado": {
                "id_emp": emp.id_emp if emp else asig.id_emp,
                "rut": emp.rut if emp else "N/A",
                "nombre": emp.nombre if emp else "Empleado Desconocido",
                "email": emp.email if emp else "N/A",
                "cargo": cargo.nombre if cargo else None,
                "departamento": dpto.nom_dpto if dpto else None,
            },
            "registrado_por": _get_usuario_name(asig.id_usuario_reg, db),
        })

    # 2. Historial de cambios de estado
    estados_raw = (
        db.query(HistorialEstado)
        .filter(HistorialEstado.id_act == id_act)
        .order_by(HistorialEstado.fecha_reg.desc())
        .all()
    )

    historial_estados = []
    for hes in estados_raw:
        tipo_est = db.query(TipoEstado).filter(TipoEstado.id_tipoe == hes.id_tipoe).first()
        historial_estados.append({
            "id_hes": hes.id_hes,
            "fecha_reg": hes.fecha_reg,
            "estado": tipo_est.nombre if tipo_est else "N/A",
            "causa": hes.causa,
            "descr": hes.descr,
            "registrado_por": _get_usuario_name(hes.id_usuario_reg, db),
        })

    # 3. Historial de checklists (preparación / reasignación)
    checklists_raw = (
        db.query(Checklist)
        .options(joinedload(Checklist.pasos))
        .filter(Checklist.id_act == id_act)
        .order_by(Checklist.fecha_ini.desc().nullslast(), Checklist.id_check.desc())
        .all()
    )

    historial_checklists = []
    for chk in checklists_raw:
        total = len(chk.pasos)
        resueltos = sum(1 for p in chk.pasos if p.estado in ("completado", "no_aplica"))
        historial_checklists.append({
            "id_check": chk.id_check,
            "nombre": chk.nombre,
            "proposito": chk.proposito,
            "estado": chk.estado,
            "fecha_ini": chk.fecha_ini,
            "fecha_ter": chk.fecha_ter,
            "id_asig": chk.id_asig,
            "pasos_resueltos": resueltos,
            "pasos_total": total,
            "registrado_por": _get_usuario_name(chk.id_usuario, db),
            "pasos": [
                {
                    "orden": p.orden,
                    "descr": p.descr,
                    "estado": p.estado,
                    "observacion": p.observacion,
                }
                for p in sorted(chk.pasos, key=lambda x: x.orden)
            ],
        })

    return {
        "activo": resumen_activo,
        "historial_asignaciones": historial_asignaciones,
        "historial_estados": historial_estados,
        "historial_checklists": historial_checklists,
    }


@router.get("/empleado/{id_emp}")
def obtener_trazabilidad_empleado(
    id_emp: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    emp = db.query(Empleado).filter(Empleado.id_emp == id_emp).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    cargo = db.query(Cargo).filter(Cargo.id_cargo == emp.id_cargo).first()
    planta = db.query(Planta).filter(Planta.id_planta == emp.id_planta).first()
    dpto = db.query(Departamento).filter(Departamento.id_dpto == emp.id_dpto).first() if emp.id_dpto else None
    sub = db.query(SubArea).filter(SubArea.id_sub == emp.id_sub).first() if emp.id_sub else None

    datos_empleado = {
        "id_emp": emp.id_emp,
        "rut": emp.rut,
        "nombre": emp.nombre,
        "email": emp.email,
        "operatividad": emp.operatividad,
        "cargo": cargo.nombre if cargo else "N/A",
        "planta": planta.nombre if planta else "N/A",
        "departamento": dpto.nom_dpto if dpto else "Sin Asignar",
        "sub_area": sub.nombre if sub else None,
    }

    # Asignaciones del empleado
    asignaciones_raw = (
        db.query(Asignacion)
        .filter(Asignacion.id_emp == id_emp)
        .order_by(Asignacion.fecha_entr.desc())
        .all()
    )

    activos_actuales = []
    historial_activos_previos = []

    for asig in asignaciones_raw:
        act = db.query(ActivoTi).filter(ActivoTi.id_act == asig.id_act).first()
        if not act:
            continue
        resumen_act = _get_activo_summary(act, db)
        item = {
            "id_asig": asig.id_asig,
            "fecha_entr": asig.fecha_entr,
            "fecha_dev": asig.fecha_dev,
            "ruta_acta_entr": asig.ruta_acta_entr,
            "registrado_por": _get_usuario_name(asig.id_usuario_reg, db),
            "activo": resumen_act,
        }
        if asig.fecha_dev is None:
            activos_actuales.append(item)
        else:
            historial_activos_previos.append(item)

    # Licencias asignadas
    emp_lics = db.query(EmpLic).filter(EmpLic.id_emp == id_emp).all()
    licencias = []
    for el in emp_lics:
        lic = db.query(Licencia).filter(Licencia.id_lic == el.id_lic).first()
        if lic:
            prov = db.query(ProveedorLicencia).filter(ProveedorLicencia.id_prov == lic.id_prov).first()
            ver = db.query(VersionLicencia).filter(VersionLicencia.id_ver == lic.id_ver).first()
            licencias.append({
                "id_lic": lic.id_lic,
                "proveedor": prov.nombre if prov else "N/A",
                "version": ver.nombre if ver else "N/A",
                "fecha_asignacion": el.fecha_asignacion,
            })

    return {
        "empleado": datos_empleado,
        "activos_actuales": activos_actuales,
        "historial_activos_previos": historial_activos_previos,
        "licencias": licencias,
    }
