from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user, require_editor
from app.modules.catalogos.models_org import Departamento, SubArea
from app.modules.catalogos.schemas import SubAreaCreate, SubAreaOut, SubAreaUpdate
from app.modules.empleados.models import Empleado

router = APIRouter(prefix="/sub-areas", tags=["sub_areas"])


@router.get("/", response_model=list[SubAreaOut])
def listar(
    id_dpto: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Devuelve todas las subáreas, opcionalmente filtradas por departamento."""
    query = db.query(SubArea)
    if id_dpto:
        query = query.filter(SubArea.id_dpto == id_dpto)
    return query.all()


@router.get("/{id_sub}", response_model=SubAreaOut)
def obtener(
    id_sub: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Devuelve una subárea por id."""
    registro = db.query(SubArea).filter(SubArea.id_sub == id_sub).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Subárea no encontrada")
    return registro


@router.post("/", response_model=SubAreaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: SubAreaCreate, db: Session = Depends(get_db)):
    if (
        db.query(Departamento).filter(Departamento.id_dpto == payload.id_dpto).first()
        is None
    ):
        raise HTTPException(status_code=400, detail="Departamento no existe")
    nuevo = SubArea(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_sub}", response_model=SubAreaOut)
def actualizar(
    id_sub: int,
    payload: SubAreaUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    registro = db.query(SubArea).filter(SubArea.id_sub == id_sub).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Subárea no encontrada")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_sub}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_sub: int, db: Session = Depends(get_db), current_user=Depends(require_editor)
):
    registro = db.query(SubArea).filter(SubArea.id_sub == id_sub).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Subárea no encontrada")

    tiene_hijos = db.query(Empleado).filter(Empleado.id_sub == id_sub).first()
    if tiene_hijos:
        raise HTTPException(
            status_code=400, detail="No se puede eliminar: tiene registros asociados"
        )

    db.delete(registro)
    db.commit()
    return None
