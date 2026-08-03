from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from auth.dependencies import get_current_user, require_editor


from database import get_db
from models.licencia_model import Licencia, ProveedorLicencia, VersionLicencia
from schemas.licencia_schema import LicenciaCreate, LicenciaUpdate, LicenciaOut

router = APIRouter(prefix="/licencia", tags=["Licencias"])


def _a_licencia_out(lic: Licencia) -> LicenciaOut:
    """Hidrata nombres de proveedor y versión para la respuesta."""
    return LicenciaOut(
        id_lic=lic.id_lic,
        id_prov=lic.id_prov,
        id_ver=lic.id_ver,
        proveedor=lic.proveedor.nombre if lic.proveedor else "N/A",
        version=lic.version.nombre if lic.version else "N/A",
    )


@router.get("/", response_model=list[LicenciaOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todas las licencias con proveedor y versión."""
    licencias = (
        db.query(Licencia)
        .options(
            joinedload(Licencia.proveedor),
            joinedload(Licencia.version),
        )
        .all()
    )
    return [_a_licencia_out(lic) for lic in licencias]


@router.get("/{id_lic}", response_model=LicenciaOut)
def obtener(
    id_lic: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Devuelve una licencia por id."""
    lic = (
        db.query(Licencia)
        .options(
            joinedload(Licencia.proveedor),
            joinedload(Licencia.version),
        )
        .filter(Licencia.id_lic == id_lic)
        .first()
    )
    if lic is None:
        raise HTTPException(status_code=404, detail="Licencia no encontrada")
    return _a_licencia_out(lic)


@router.post("/", response_model=LicenciaOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: LicenciaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    if (
        db.query(ProveedorLicencia)
        .filter(ProveedorLicencia.id_prov == payload.id_prov)
        .first()
        is None
    ):
        raise HTTPException(status_code=400, detail="Proveedor no existe")

    if (
        db.query(VersionLicencia)
        .filter(VersionLicencia.id_ver == payload.id_ver)
        .first()
        is None
    ):
        raise HTTPException(status_code=400, detail="Versión no existe")
    # evita que se cree una licencia con un proveedor y una version que no coinciden
    version = (
        db.query(VersionLicencia)
        .filter(
            VersionLicencia.id_ver == payload.id_ver,
            VersionLicencia.id_prov == payload.id_prov,
        )
        .first()
    )
    if version is None:
        raise HTTPException(
            status_code=400,
            detail="La versión no corresponde al proveedor seleccionado",
        )
    nueva_lic = Licencia(**payload.model_dump())

    db.add(nueva_lic)
    db.commit()
    db.refresh(nueva_lic)

    # Recargar con relaciones para la respuesta enriquecida
    lic = (
        db.query(Licencia)
        .options(
            joinedload(Licencia.proveedor),
            joinedload(Licencia.version),
        )
        .filter(Licencia.id_lic == nueva_lic.id_lic)
        .first()
    )
    return _a_licencia_out(lic)


@router.put("/{id_lic}", response_model=LicenciaOut)
def actualizar(
    id_lic: int,
    payload: LicenciaUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    act_lic = db.query(Licencia).filter(Licencia.id_lic == id_lic).first()

    if act_lic is None:
        raise HTTPException(status_code=404, detail="No encontrado")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(act_lic, campo, valor)

    db.commit()
    db.refresh(act_lic)

    lic = (
        db.query(Licencia)
        .options(
            joinedload(Licencia.proveedor),
            joinedload(Licencia.version),
        )
        .filter(Licencia.id_lic == id_lic)
        .first()
    )
    return _a_licencia_out(lic)
