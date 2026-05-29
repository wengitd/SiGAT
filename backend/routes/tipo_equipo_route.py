from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.activo_ti_model import TipoEquipo, EquipoComputo
from schemas.catalogos_schema import TipoEquipoCreate, TipoEquipoUpdate, TipoEquipoOut

router = APIRouter(prefix="/tipos-equipo", tags=["tipos_equipo"])


@router.get("/", response_model=list[TipoEquipoOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todos los tipos de equipo."""
    return db.query(TipoEquipo).all()


@router.get("/{id_tipoeq}", response_model=TipoEquipoOut)
def obtener(id_tipoeq: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve un tipo de equipo por id."""
    registro = db.query(TipoEquipo).filter(TipoEquipo.id_tipoeq == id_tipoeq).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Tipo de equipo no encontrado")
    return registro


@router.post("/", response_model=TipoEquipoOut, status_code=status.HTTP_201_CREATED)
def crear(payload: TipoEquipoCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    nuevo = TipoEquipo(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_tipoeq}", response_model=TipoEquipoOut)
def actualizar(id_tipoeq: int, payload: TipoEquipoUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(TipoEquipo).filter(TipoEquipo.id_tipoeq == id_tipoeq).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Tipo de equipo no encontrado")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_tipoeq}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_tipoeq: int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(TipoEquipo).filter(TipoEquipo.id_tipoeq == id_tipoeq).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Tipo de equipo no encontrado")

    tiene_hijos = db.query(EquipoComputo).filter(EquipoComputo.id_tipoeq == id_tipoeq).first()
    if tiene_hijos:
        raise HTTPException(status_code=400, detail="No se puede eliminar: tiene registros asociados")

    db.delete(registro)
    db.commit()
    return None
