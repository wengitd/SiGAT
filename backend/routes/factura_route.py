from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_user, require_editor


from models.factura_model import Factura, ProveedorFactura
from schemas.factura_schema import FacturaCreate, FacturaUpdate, FacturaOut

router=APIRouter(prefix="/factura", tags=["Factura"])

@router.get("/", response_model=list[FacturaOut])
def listar (db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    "Devuelve todos las Facturas."
    #return.db.query(model.py)
    return db.query(Factura).all()


@router.get("/{id_fact}", response_model=FacturaOut)
def obtener (id_fact: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve una Factura por id."""
    
    #variable = db.query(model).filter(model.id == id).first()
    fact = db.query(Factura).filter(Factura.id_fact == id_fact).first()
    if fact is None:
        raise  HTTPException(status_code=404, detail="Factura no encontrada")
    return fact



@router.post("/", response_model=FacturaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: FacturaCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    if db.query(ProveedorFactura).filter(ProveedorFactura.id_prov_fact == payload.id_prov_fact).first() is None:
        raise HTTPException(status_code=400, detail="Proveedor no existe") 
    #crear el objeto SQLAlchemy     
    #variable=model(**play.model_dump())
    nueva_fact = Factura(**payload.model_dump())
    
    #guarda
    db.add(nueva_fact)
    db.commit()
    db.refresh(nueva_fact)
    return nueva_fact

@router.put("/{id_fact}", response_model=FacturaOut)
def actualizar(id_fact:int, payload: FacturaUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    #variable=db.query(model.py).filter(model.id_model==id_model).first()
    act_fact = db.query(Factura).filter(Factura.id_fact == id_fact).first()

    if act_fact is None:
        raise HTTPException(status_code=404, detail="No encontrado")

    datos= payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(act_fact,campo,valor)
    
    db.commit()
    db.refresh(act_fact)
    return act_fact


#la opcion de eliminar una factura no está contemplado.
