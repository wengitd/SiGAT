from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.activo_ti_model import FamiliaSO, VersionSO, EdicionSO, EquipoComputo
from schemas.catalogos_schema import (
    FamiliaSOCreate,
    FamiliaSOUpdate,
    FamiliaSOOut,
    VersionSOCreate,
    VersionSOUpdate,
    VersionSOOut,
    EdicionSOCreate,
    EdicionSOUpdate,
    EdicionSOOut,
)

router = APIRouter(prefix="/sistemas-operativos", tags=["Sistemas Operativos"])


# ── Familia SO ───────────────────────────────────────────────────────────────


@router.get("/familias", response_model=list[FamiliaSOOut])
def listar_familias(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return db.query(FamiliaSO).all()


@router.post(
    "/familias", response_model=FamiliaSOOut, status_code=status.HTTP_201_CREATED
)
def crear_familia(
    payload: FamiliaSOCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    if db.query(FamiliaSO).filter(FamiliaSO.nombre == payload.nombre).first():
        raise HTTPException(status_code=400, detail="Familia ya existe")
    nuevo = FamiliaSO(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/familias/{id_fam_so}", response_model=FamiliaSOOut)
def actualizar_familia(
    id_fam_so: int,
    payload: FamiliaSOUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    registro = db.query(FamiliaSO).filter(FamiliaSO.id_fam_so == id_fam_so).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Familia no encontrada")
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(registro, campo, valor)
    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/familias/{id_fam_so}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_familia(
    id_fam_so: int, db: Session = Depends(get_db), current_user=Depends(require_editor)
):
    registro = db.query(FamiliaSO).filter(FamiliaSO.id_fam_so == id_fam_so).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Familia no encontrada")
    if db.query(VersionSO).filter(VersionSO.id_fam_so == id_fam_so).first():
        raise HTTPException(
            status_code=400, detail="No se puede eliminar: tiene versiones asociadas"
        )
    db.delete(registro)
    db.commit()
    return None


# ── Version SO ───────────────────────────────────────────────────────────────


@router.get("/versiones", response_model=list[VersionSOOut])
def listar_versiones(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return db.query(VersionSO).all()


@router.get("/versiones/por-familia/{id_fam_so}", response_model=list[VersionSOOut])
def versiones_por_familia(
    id_fam_so: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(VersionSO).filter(VersionSO.id_fam_so == id_fam_so).all()


@router.post(
    "/versiones", response_model=VersionSOOut, status_code=status.HTTP_201_CREATED
)
def crear_version(
    payload: VersionSOCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    if (
        db.query(FamiliaSO).filter(FamiliaSO.id_fam_so == payload.id_fam_so).first()
        is None
    ):
        raise HTTPException(status_code=404, detail="Familia no encontrada")
    nuevo = VersionSO(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/versiones/{id_ver_so}", response_model=VersionSOOut)
def actualizar_version(
    id_ver_so: int,
    payload: VersionSOUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    registro = db.query(VersionSO).filter(VersionSO.id_ver_so == id_ver_so).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Versión no encontrada")
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(registro, campo, valor)
    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/versiones/{id_ver_so}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_version(
    id_ver_so: int, db: Session = Depends(get_db), current_user=Depends(require_editor)
):
    registro = db.query(VersionSO).filter(VersionSO.id_ver_so == id_ver_so).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Versión no encontrada")
    if db.query(EdicionSO).filter(EdicionSO.id_ver_so == id_ver_so).first():
        raise HTTPException(
            status_code=400, detail="No se puede eliminar: tiene ediciones asociadas"
        )
    db.delete(registro)
    db.commit()
    return None


# ── Edicion SO ───────────────────────────────────────────────────────────────


@router.get("/ediciones", response_model=list[EdicionSOOut])
def listar_ediciones(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return db.query(EdicionSO).all()


@router.get("/ediciones/por-version/{id_ver_so}", response_model=list[EdicionSOOut])
def ediciones_por_version(
    id_ver_so: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(EdicionSO).filter(EdicionSO.id_ver_so == id_ver_so).all()


@router.post(
    "/ediciones", response_model=EdicionSOOut, status_code=status.HTTP_201_CREATED
)
def crear_edicion(
    payload: EdicionSOCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    if (
        db.query(VersionSO).filter(VersionSO.id_ver_so == payload.id_ver_so).first()
        is None
    ):
        raise HTTPException(status_code=404, detail="Versión no encontrada")
    nuevo = EdicionSO(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/ediciones/{id_edicion_so}", response_model=EdicionSOOut)
def actualizar_edicion(
    id_edicion_so: int,
    payload: EdicionSOUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    registro = (
        db.query(EdicionSO).filter(EdicionSO.id_edicion_so == id_edicion_so).first()
    )
    if registro is None:
        raise HTTPException(status_code=404, detail="Edición no encontrada")
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(registro, campo, valor)
    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/ediciones/{id_edicion_so}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_edicion(
    id_edicion_so: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    registro = (
        db.query(EdicionSO).filter(EdicionSO.id_edicion_so == id_edicion_so).first()
    )
    if registro is None:
        raise HTTPException(status_code=404, detail="Edición no encontrada")
    if (
        db.query(EquipoComputo)
        .filter(EquipoComputo.id_edicion_so == id_edicion_so)
        .first()
    ):
        raise HTTPException(
            status_code=400, detail="No se puede eliminar: tiene equipos asociados"
        )
    db.delete(registro)
    db.commit()
    return None
