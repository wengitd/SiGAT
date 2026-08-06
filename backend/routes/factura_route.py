from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user, require_editor
from database import get_db
from models.activo_ti_model import ActivoTi
from models.factura_model import Factura
from schemas.factura_schema import FacturaCreate, FacturaUpdate, FacturaOut
from services import factura_storage

router = APIRouter(prefix="/factura", tags=["Factura"])


@router.get("/", response_model=list[FacturaOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todas las Facturas."""
    return db.query(Factura).all()


@router.post(
    "/upload",
    response_model=FacturaOut,
    status_code=status.HTTP_201_CREATED,
)
async def subir_factura(
    id_act: int = Form(...),
    fecha_em: date = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Crea una factura con PDF y la asocia al activo indicado."""
    activo = db.query(ActivoTi).filter(ActivoTi.id_act == id_act).first()
    if activo is None:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    if activo.id_fact is not None:
        raise HTTPException(
            status_code=400,
            detail="El activo ya tiene una factura asociada; use reemplazar PDF",
        )

    pdf_bytes = await factura_storage.validate_pdf(file)
    ruta_relativa = factura_storage.save_pdf(id_act, pdf_bytes)

    try:
        nueva_fact = Factura(
            fecha_em=fecha_em,
            ruta_pdf_fact=ruta_relativa,
        )
        db.add(nueva_fact)
        db.flush()
        activo.id_fact = nueva_fact.id_fact
        db.commit()
        db.refresh(nueva_fact)
        return nueva_fact
    except Exception:
        db.rollback()
        factura_storage.delete_pdf(ruta_relativa)
        raise


@router.get("/{id_fact}/pdf")
def obtener_pdf(
    id_fact: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Sirve el PDF de la factura desde el volumen local."""
    fact = db.query(Factura).filter(Factura.id_fact == id_fact).first()
    if fact is None:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    path = factura_storage.absolute_path(fact.ruta_pdf_fact)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Archivo PDF no encontrado")

    return FileResponse(
        path,
        media_type="application/pdf",
        filename=path.name,
        content_disposition_type="inline",
    )


@router.put("/{id_fact}/pdf", response_model=FacturaOut)
async def reemplazar_pdf(
    id_fact: int,
    file: UploadFile = File(...),
    fecha_em: date | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Reemplaza el PDF de una factura existente y opcionalmente actualiza la fecha de emisión."""
    fact = db.query(Factura).filter(Factura.id_fact == id_fact).first()
    if fact is None:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    activo = db.query(ActivoTi).filter(ActivoTi.id_fact == id_fact).first()
    if activo is None:
        raise HTTPException(
            status_code=400,
            detail="No se encontró el activo asociado a esta factura",
        )

    pdf_bytes = await factura_storage.validate_pdf(file)
    ruta_anterior = fact.ruta_pdf_fact
    ruta_nueva = factura_storage.save_pdf(activo.id_act, pdf_bytes)

    try:
        fact.ruta_pdf_fact = ruta_nueva
        if fecha_em is not None:
            fact.fecha_em = fecha_em
        db.commit()
        db.refresh(fact)
        factura_storage.delete_pdf(ruta_anterior)
        return fact
    except Exception:
        db.rollback()
        factura_storage.delete_pdf(ruta_nueva)
        raise


@router.get("/{id_fact}", response_model=FacturaOut)
def obtener(
    id_fact: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Devuelve una Factura por id."""
    fact = db.query(Factura).filter(Factura.id_fact == id_fact).first()
    if fact is None:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return fact


@router.post("/", response_model=FacturaOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: FacturaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    nueva_fact = Factura(**payload.model_dump())
    db.add(nueva_fact)
    db.commit()
    db.refresh(nueva_fact)
    return nueva_fact


@router.put("/{id_fact}", response_model=FacturaOut)
def actualizar(
    id_fact: int,
    payload: FacturaUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    act_fact = db.query(Factura).filter(Factura.id_fact == id_fact).first()

    if act_fact is None:
        raise HTTPException(status_code=404, detail="No encontrado")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(act_fact, campo, valor)

    db.commit()
    db.refresh(act_fact)
    return act_fact
