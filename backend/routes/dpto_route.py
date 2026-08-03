from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from auth.dependencies import get_current_user, require_editor


from database import get_db
from models.dpto_model import Departamento, Empresa
from schemas.dpto_schema import DepartamentoCreate, DepartamentoUpdate, DepartamentoOut

router = APIRouter(prefix="/departamento", tags=["departamento"])


@router.get("/", response_model=list[DepartamentoOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    "Devuelve todos los departamentos."
    # return.db.query(model.py)
    return (
        db.query(Departamento)
        .options(joinedload(Departamento.empresa), joinedload(Departamento.subareas))
        .all()
    )


@router.get("/{id_dpto}", response_model=DepartamentoOut)
def obtener(
    id_dpto: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Devuelve un departamento por id."""

    dptos = db.query(Departamento).filter(Departamento.id_dpto == id_dpto).first()
    if dptos is None:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    return dptos


@router.post("/", response_model=DepartamentoOut, status_code=status.HTTP_201_CREATED)
def crear(payload: DepartamentoCreate, db: Session = Depends(get_db)):
    if db.query(Empresa).filter(Empresa.id_org == payload.id_org).first() is None:
        raise HTTPException(status_code=400, detail="Empresa no existe")

    # Validar duplicado
    existente = (
        db.query(Departamento)
        .filter(
            Departamento.nom_dpto == payload.nom_dpto.strip().lower(),
            Departamento.id_org == payload.id_org,
        )
        .first()
    )
    if existente:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un departamento con ese nombre en esta empresa",
        )

    nuevo_dptos = Departamento(**payload.model_dump())
    db.add(nuevo_dptos)
    db.commit()
    db.refresh(nuevo_dptos)
    return nuevo_dptos


@router.put("/{id_dpto}", response_model=DepartamentoOut)
def actualizar(
    id_dpto: int,
    payload: DepartamentoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    # variable=db.query(model.py).filter(model.id_model==id_model).first()
    act_dpto = db.query(Departamento).filter(Departamento.id_dpto == id_dpto).first()

    if act_dpto is None:
        raise HTTPException(status_code=404, detail="No encontrado")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(act_dpto, campo, valor)

    db.commit()
    db.refresh(act_dpto)
    return act_dpto


# los departamentos son entidades estables, no se eliminan
# se crea el endpoint en base a un atributo de operatividad, pero no está en ER, schema, ni init,
# ni agregado al modelo.py
# si se agrega el endpoint, Resetear la BD: DROP SCHEMA public CASCADE; CREATE SCHEMA public;
# en pgAdmin y volver a correr init.sql.
"""
@router.delete ("/{id_dpto}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_dpto:int, db: Session = Depends(get_db)):
    eli_dpto= db.query(Departamento).filter(Departamento.id_dpto == id_dpto).first()
    
    if eli_dpto is None:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")

    eli_dpto.operatividad=False
    db.commit()

    return None
"""
