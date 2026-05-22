from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor


from database import get_db
from models.licencia_model import Licencia
from schemas.licencia_schema import LicenciaCreate, LicenciaUpdate, LicenciaOut

router=APIRouter(prefix="/licencia", tags=["Licencias"])


@router.get("/", response_model=list[LicenciaOut])
def listar (db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    "Devuelve todos las Licencias."
    #return.db.query(model)
    return db.query(Licencia).all()


@router.get("/{id_lic}", response_model=LicenciaOut)
def obtener (id_lic: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve una Licencia por id."""
    
    #variable = db.query(model).filter(model.id == id).first()
    lic = db.query(Licencia).filter(Licencia.id_lic == id_lic).first()
    if lic is None:
        raise  HTTPException(status_code=404, detail="Licencia no encontrada")
    return lic


@router.post("/", response_model=LicenciaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: LicenciaCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    #crear el objeto SQLAlchemy     
    #variable=model(**play.model_dump())
    nueva_lic = Licencia(**payload.model_dump())
    
    #guarda
    db.add(nueva_lic)
    db.commit()
    db.refresh(nueva_lic)
    return nueva_lic


@router.put("/{id_lic}", response_model=LicenciaOut)
def actualizar(id_lic:int, payload: LicenciaUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    #variable=db.query(model.py).filter(model.id_model==id_model).first()
    act_lic= db.query(Licencia).filter(Licencia.id_lic == id_lic).first()

    if act_lic is None:
        raise HTTPException(status_code=404, detail="No encontrado")

    datos= payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(act_lic,campo,valor)
    
    db.commit()
    db.refresh(act_lic)
    return act_lic
