from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.activo_ti_model import SistemaOperativo, EquipoComputo
from schemas.catalogos_schema import SistemaOperativoCreate, SistemaOperativoUpdate, SistemaOperativoOut

router = APIRouter(prefix="/sistemas-operativos", tags=["sistemas_operativos"])


@router.get("/", response_model=list[SistemaOperativoOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todos los sistemas operativos."""
    return db.query(SistemaOperativo).all()


@router.get("/{id_so}", response_model=SistemaOperativoOut)
def obtener(id_so: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve un sistema operativo por id."""
    registro = db.query(SistemaOperativo).filter(SistemaOperativo.id_so == id_so).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Sistema operativo no encontrado")
    return registro


@router.post("/", response_model=SistemaOperativoOut, status_code=status.HTTP_201_CREATED)
def crear(payload: SistemaOperativoCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    nuevo = SistemaOperativo(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_so}", response_model=SistemaOperativoOut)
def actualizar(id_so: int, payload: SistemaOperativoUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(SistemaOperativo).filter(SistemaOperativo.id_so == id_so).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Sistema operativo no encontrado")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_so}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_so: int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(SistemaOperativo).filter(SistemaOperativo.id_so == id_so).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Sistema operativo no encontrado")

    tiene_hijos = db.query(EquipoComputo).filter(EquipoComputo.id_so == id_so).first()
    if tiene_hijos:
        raise HTTPException(status_code=400, detail="No se puede eliminar: tiene registros asociados")

    db.delete(registro)
    db.commit()
    return None
