from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.asignacion_model import Asignacion
from schemas.asignacion_schema import AsignacionCreate, AsignacionUpdate, AsignacionOut
from auth.dependencies import get_current_user, require_editor


from models.activo_ti_model import ActivoTi
from models.empleado_model import Empleado

router=APIRouter(prefix="/asignaciones", tags=["Asignaciones"])


@router.get("/", response_model=list[AsignacionOut])
def listar (db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    "Devuelve todos las asignaciones."
    #return.db.query(model.py)
    return db.query(Asignacion).all()

@router.get("/{id_asig}", response_model=AsignacionOut)
def obtener(id_asig: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve una Asignacion por id."""
    asig = db.query(Asignacion).filter(Asignacion.id_asig == id_asig).first()
    if asig is None:
        raise HTTPException(status_code=404, detail="Asignacion no encontrada")
    return asig


@router.post("/", response_model=AsignacionOut, status_code=status.HTTP_201_CREATED)
def crear(payload: AsignacionCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
     
     # Bloque para las FK y validaciones
    
    query_emp = db.query(Empleado).filter(Empleado.id_emp == payload.id_emp).first()
    query_asig=db.query(Asignacion).filter(
        Asignacion.id_act == payload.id_act,
        Asignacion.fecha_dev.is_(None),  # sigue asignado
    ).first()

    #valida si existe el activo.
    if db.query(ActivoTi).filter(ActivoTi.id_act==payload.id_act).first() is None:
        raise HTTPException(status_code=400, detail="Activo no existe")

    # valida si el activo ya tiene una asignación vigente (sin fecha de devolución)
    if query_asig is not None:
        raise HTTPException(status_code=400, detail="El activo ya está en uso")
    #valida si el empleado existe
    if query_emp is None:
        raise HTTPException(status_code=400, detail="Empleado no existe")
    #valida que el empleado esté activo    
    if query_emp.operatividad == False:
        raise HTTPException(status_code=400, detail="Empleado inactivo") 

    #crear el objeto SQLAlchemy     
    #variable=model(**play.model_dump())
    nueva_asig = Asignacion(**payload.model_dump())
    
    #guarda
    db.add(nueva_asig)
    db.commit()
    db.refresh(nueva_asig)
    return nueva_asig


@router.put("/{id_asig}", response_model=AsignacionOut)
def actualizar(id_asig:int, payload: AsignacionUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    #variable=db.query(model.py).filter(model.id_model==id_model).first()
    act_asig = db.query(Asignacion).filter(Asignacion.id_asig == id_asig).first()

    if act_asig is None:
        raise HTTPException(status_code=404, detail="No encontrado")

    if act_asig.fecha_dev is not None:
        raise HTTPException(status_code=400, detail="La devolución ya fue registrada")

    datos = payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(act_asig, campo, valor)
    
    db.commit()
    db.refresh(act_asig)
    return act_asig
