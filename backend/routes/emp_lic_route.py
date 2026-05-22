from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor


from database import get_db
from models.empleado_model import Empleado #para la validacion
from models.licencia_model import Licencia

from models.emp_lic_model import EmpLic
from schemas.emp_lic_schema import EmpleadoLicenciaCreate, EmpleadoLicenciaOut


router=APIRouter(prefix="/emp_licencias", tags=["Empleado y Licencia"])

@router.post("/", response_model=EmpleadoLicenciaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: EmpleadoLicenciaCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    
    # Validar que el empleado existe
    emp = db.query(Empleado).filter(Empleado.id_emp == payload.id_emp).first()
    if emp is None:
        raise HTTPException(status_code=400, detail="Empleado no existe")
    

    # Validar que la licencia existe
    lic = db.query(Licencia).filter(Licencia.id_lic == payload.id_lic).first()
    if lic is None:
        raise HTTPException(status_code=400, detail="Licencia no existe")
    
    #Validar que no exista ya esa asignación (PK compuesta no puede duplicarse)
    existente = db.query(EmpLic).filter(
        EmpLic.id_emp == payload.id_emp,
        EmpLic.id_lic == payload.id_lic
    ).first()
    if existente is not None:
        raise HTTPException(status_code=400, detail="Esta licencia ya está asignada a este empleado")
    
    # Crear y guardar
    nuevo = EmpLic(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.delete("/{id_emp}/{id_lic}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_emp: int, id_lic: int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    """Para eliminar necesitamos los DOS ids porque la PK es compuesta."""
    eli_emplic = db.query(EmpLic).filter(
        EmpLic.id_emp == id_emp,
        EmpLic.id_lic == id_lic
    ).first()
    
    if eli_emplic is None:
        raise HTTPException(status_code=404, detail="No encontrada")
    
    #hard delete
    db.delete(eli_emplic)  
    db.commit()
    return None