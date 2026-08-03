from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from auth.dependencies import get_current_user, require_editor


from database import get_db
from models.empleado_model import Empleado
from models.licencia_model import Licencia

from models.emp_lic_model import EmpLic
from schemas.emp_lic_schema import (
    EmpleadoLicenciaCreate,
    EmpleadoLicenciaOut,
    EmpleadoLicenciaDetalleOut,
)


router = APIRouter(prefix="/emp_licencias", tags=["Empleado y Licencia"])


def _enriquecer_asignacion(el: EmpLic, lic: Licencia) -> EmpleadoLicenciaDetalleOut:
    """Arma la respuesta con nombres de proveedor y versión."""
    return EmpleadoLicenciaDetalleOut(
        id_emp=el.id_emp,
        id_lic=el.id_lic,
        proveedor=lic.proveedor.nombre if lic.proveedor else "N/A",
        version=lic.version.nombre if lic.version else "N/A",
        fecha_asignacion=el.fecha_asignacion,
    )


@router.get("/", response_model=list[EmpleadoLicenciaDetalleOut])
def listar(
    id_emp: int = Query(..., description="ID del empleado"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Lista las licencias asignadas a un empleado, con proveedor y versión."""
    emp = db.query(Empleado).filter(Empleado.id_emp == id_emp).first()
    if emp is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    emp_lics = db.query(EmpLic).filter(EmpLic.id_emp == id_emp).all()
    if not emp_lics:
        return []

    ids_lic = [el.id_lic for el in emp_lics]
    licencias = (
        db.query(Licencia)
        .options(
            joinedload(Licencia.proveedor),
            joinedload(Licencia.version),
        )
        .filter(Licencia.id_lic.in_(ids_lic))
        .all()
    )
    lic_por_id = {lic.id_lic: lic for lic in licencias}

    return [
        _enriquecer_asignacion(el, lic_por_id[el.id_lic])
        for el in emp_lics
        if el.id_lic in lic_por_id
    ]


@router.post(
    "/", response_model=EmpleadoLicenciaOut, status_code=status.HTTP_201_CREATED
)
def crear(
    payload: EmpleadoLicenciaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):

    # Validar que el empleado existe
    emp = db.query(Empleado).filter(Empleado.id_emp == payload.id_emp).first()
    if emp is None:
        raise HTTPException(status_code=400, detail="Empleado no existe")

    # Validar que la licencia existe
    lic = db.query(Licencia).filter(Licencia.id_lic == payload.id_lic).first()
    if lic is None:
        raise HTTPException(status_code=400, detail="Licencia no existe")

    # Validar que no exista ya esa asignación (PK compuesta no puede duplicarse)
    existente = (
        db.query(EmpLic)
        .filter(EmpLic.id_emp == payload.id_emp, EmpLic.id_lic == payload.id_lic)
        .first()
    )
    if existente is not None:
        raise HTTPException(
            status_code=400, detail="Esta licencia ya está asignada a este empleado"
        )

    # Crear y guardar con la fecha de asignación del día
    nuevo = EmpLic(
        id_emp=payload.id_emp,
        id_lic=payload.id_lic,
        fecha_asignacion=date.today(),
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.delete("/{id_emp}/{id_lic}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_emp: int,
    id_lic: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Para eliminar necesitamos los DOS ids porque la PK es compuesta."""
    eli_emplic = (
        db.query(EmpLic)
        .filter(EmpLic.id_emp == id_emp, EmpLic.id_lic == id_lic)
        .first()
    )

    if eli_emplic is None:
        raise HTTPException(status_code=404, detail="No encontrada")

    # hard delete
    db.delete(eli_emplic)
    db.commit()
    return None
