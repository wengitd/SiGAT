from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.licencia_model import VersionLicencia, Licencia
from schemas.catalogos_schema import VersionLicenciaCreate, VersionLicenciaUpdate, VersionLicenciaOut

router = APIRouter(prefix="/versiones-licencia", tags=["versiones_licencia"])


@router.get("/", response_model=list[VersionLicenciaOut])
def listar(id_prov: int | None = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todas las versiones de licencia, opcionalmente filtradas por proveedor."""
    query = db.query(VersionLicencia)
    if id_prov:
        query = query.filter(VersionLicencia.id_prov == id_prov)
    return query.all()


@router.get("/{id_ver}", response_model=VersionLicenciaOut)
def obtener(id_ver: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve una versión de licencia por id."""
    registro = db.query(VersionLicencia).filter(VersionLicencia.id_ver == id_ver).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Versión de licencia no encontrada")
    return registro


@router.post("/", response_model=VersionLicenciaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: VersionLicenciaCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    nuevo = VersionLicencia(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_ver}", response_model=VersionLicenciaOut)
def actualizar(id_ver: int, payload: VersionLicenciaUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(VersionLicencia).filter(VersionLicencia.id_ver == id_ver).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Versión de licencia no encontrada")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_ver}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_ver: int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(VersionLicencia).filter(VersionLicencia.id_ver == id_ver).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Versión de licencia no encontrada")

    tiene_hijos = db.query(Licencia).filter(Licencia.id_ver == id_ver).first()
    if tiene_hijos:
        raise HTTPException(status_code=400, detail="No se puede eliminar: tiene registros asociados")

    db.delete(registro)
    db.commit()
    return None
