from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.licencia_model import ProveedorLicencia, VersionLicencia
from schemas.catalogos_schema import (
    ProveedorLicenciaCreate,
    ProveedorLicenciaUpdate,
    ProveedorLicenciaOut,
)

router = APIRouter(prefix="/proveedores-licencia", tags=["proveedores_licencia"])


@router.get("/", response_model=list[ProveedorLicenciaOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todos los proveedores de licencia."""
    return db.query(ProveedorLicencia).all()


@router.get("/{id_prov}", response_model=ProveedorLicenciaOut)
def obtener(
    id_prov: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Devuelve un proveedor de licencia por id."""
    registro = (
        db.query(ProveedorLicencia).filter(ProveedorLicencia.id_prov == id_prov).first()
    )
    if registro is None:
        raise HTTPException(
            status_code=404, detail="Proveedor de licencia no encontrado"
        )
    return registro


@router.post(
    "/", response_model=ProveedorLicenciaOut, status_code=status.HTTP_201_CREATED
)
def crear(
    payload: ProveedorLicenciaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    nuevo = ProveedorLicencia(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_prov}", response_model=ProveedorLicenciaOut)
def actualizar(
    id_prov: int,
    payload: ProveedorLicenciaUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    registro = (
        db.query(ProveedorLicencia).filter(ProveedorLicencia.id_prov == id_prov).first()
    )
    if registro is None:
        raise HTTPException(
            status_code=404, detail="Proveedor de licencia no encontrado"
        )

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_prov}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_prov: int, db: Session = Depends(get_db), current_user=Depends(require_editor)
):
    registro = (
        db.query(ProveedorLicencia).filter(ProveedorLicencia.id_prov == id_prov).first()
    )
    if registro is None:
        raise HTTPException(
            status_code=404, detail="Proveedor de licencia no encontrado"
        )

    tiene_hijos = (
        db.query(VersionLicencia).filter(VersionLicencia.id_prov == id_prov).first()
    )
    if tiene_hijos:
        raise HTTPException(
            status_code=400, detail="No se puede eliminar: tiene registros asociados"
        )

    db.delete(registro)
    db.commit()
    return None
