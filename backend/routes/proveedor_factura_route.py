from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.factura_model import ProveedorFactura, Factura
from schemas.catalogos_schema import ProveedorFacturaCreate, ProveedorFacturaUpdate, ProveedorFacturaOut

router = APIRouter(prefix="/proveedores-factura", tags=["proveedores_factura"])


@router.get("/", response_model=list[ProveedorFacturaOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todos los proveedores de factura."""
    return db.query(ProveedorFactura).all()


@router.get("/{id_prov_fact}", response_model=ProveedorFacturaOut)
def obtener(id_prov_fact: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve un proveedor de factura por id."""
    registro = db.query(ProveedorFactura).filter(ProveedorFactura.id_prov_fact == id_prov_fact).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Proveedor de factura no encontrado")
    return registro


@router.post("/", response_model=ProveedorFacturaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: ProveedorFacturaCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    nuevo = ProveedorFactura(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_prov_fact}", response_model=ProveedorFacturaOut)
def actualizar(id_prov_fact: int, payload: ProveedorFacturaUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(ProveedorFactura).filter(ProveedorFactura.id_prov_fact == id_prov_fact).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Proveedor de factura no encontrado")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{id_prov_fact}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_prov_fact: int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    registro = db.query(ProveedorFactura).filter(ProveedorFactura.id_prov_fact == id_prov_fact).first()
    if registro is None:
        raise HTTPException(status_code=404, detail="Proveedor de factura no encontrado")

    tiene_hijos = db.query(Factura).filter(Factura.id_prov_fact == id_prov_fact).first()
    if tiene_hijos:
        raise HTTPException(status_code=400, detail="No se puede eliminar: tiene registros asociados")

    db.delete(registro)
    db.commit()
    return None
