from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.dpto_model import Empresa, Departamento
from schemas.catalogos_schema import EmpresaCreate, EmpresaUpdate, EmpresaOut

router = APIRouter(prefix="/empresas", tags=["empresas"])


@router.get("/", response_model=list[EmpresaOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todas las empresas."""
    return db.query(Empresa).all()


@router.get("/{id_org}", response_model=EmpresaOut)
def obtener(
    id_org: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Devuelve una empresa por id."""
    registro = db.query(Empresa).filter(Empresa.id_org == id_org).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return registro


@router.post("/", response_model=EmpresaOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: EmpresaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    nuevo = Empresa(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_org}", response_model=EmpresaOut)
def actualizar(
    id_org: int,
    payload: EmpresaUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    registro = db.query(Empresa).filter(Empresa.id_org == id_org).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_org}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_org: int, db: Session = Depends(get_db), current_user=Depends(require_editor)
):
    registro = db.query(Empresa).filter(Empresa.id_org == id_org).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    tiene_hijos = db.query(Departamento).filter(Departamento.id_org == id_org).first()
    if tiene_hijos:
        raise HTTPException(
            status_code=400, detail="No se puede eliminar: tiene registros asociados"
        )

    db.delete(registro)
    db.commit()
    return None
