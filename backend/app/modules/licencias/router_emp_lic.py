from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user, require_editor
from app.modules.licencias import service as emp_lic_service
from app.modules.licencias.schemas_emp_lic import (
    EmpleadoLicenciaCreate,
    EmpleadoLicenciaDetalleOut,
    EmpleadoLicenciaOut,
)

router = APIRouter(prefix="/emp_licencias", tags=["Empleado y Licencia"])


@router.get("/", response_model=list[EmpleadoLicenciaDetalleOut])
def listar(
    id_emp: int = Query(..., description="ID del empleado"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Lista las versiones de licencia asignadas a un empleado."""
    return emp_lic_service.listar_asignaciones(db, id_emp)


@router.post(
    "/", response_model=EmpleadoLicenciaOut, status_code=status.HTTP_201_CREATED
)
def crear(
    payload: EmpleadoLicenciaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Asigna una versión de licencia. Un proveedor por empleado."""
    return emp_lic_service.asignar(db, payload)


@router.delete("/{id_emp}/{id_ver}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_emp: int,
    id_ver: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Para eliminar necesitamos los DOS ids porque la PK es compuesta."""
    emp_lic_service.desasignar(db, id_emp, id_ver)
    return None
