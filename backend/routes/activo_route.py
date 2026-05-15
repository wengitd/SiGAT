from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.activo_ti_model import ActivoTi, EquipoComputo, Periferico
from schemas.activo_schema  import ActivoBase, ActivoCreate, ActivoUpdate, ActivoOut

from models.factura_model import Factura
from models.tipo_estado_model import TipoEstado

router=APIRouter(prefix="/ActivoTi", tags=["Activos"])

#mapa global
SUBTIPOS = {
    "equipo_computo": EquipoComputo,
    "periferico": Periferico
}

#funcion helper

def to_dict(obj):
    
    #por si obj es null
    #if obj is None:
    #return{}
    
    """Convierte un objeto SQLAlchemy en dict aut.  los metadatos de la tabla"""
    return {col.name: getattr(obj, col.name) for col in obj.__table__.columns}

def build_activo_data(activo_model:ActivoTi, db:Session)->dict:
    """
    Arma el dict combinado de un activo con su subtipo.
    Reutilizable en obtener, listar y crear.
    """
        #         (objeto saqlalchemy)
    data = to_dict(activo_model)

    modelo_subtipo=SUBTIPOS.get(activo_model.tipo)

    if modelo_subtipo:
        #busca en la tabla "equipocomputo" el registro relacionado con el activo
        sub = db.query(modelo_subtipo).filter(modelo_subtipo.id_act == activo_model.id_act).first()
        #combina los datos. 
        #si encontro datos del subtipo, los convierte a dict
        #los mezcla con data, ya que update agrega nuevas claves al dict.
        if sub:
            data.update(to_dict(sub))
    
    return data

############################################
#Toma un dict con muchos campos y devuelve solo los que existen 
#como columnas en el modelo SQLAlchemy dado.
def split_payload_por_model(payload_dict: dict, model_class) -> dict:

    #lista columnas del modelo
    columnas = {col.name for col in model_class.__table__.columns}
    #filtra el payload dejando solo las claves que coinciden con columnas del modelo
    return {k: v for k, v in payload_dict.items() if k in columnas}


##########################################3
#funcion helper para commits
#para usar cada vez que se guarde algo en bd 
#"commit_or_rollback(db)"
def commit_or_rollback(db: Session):
    try:
        db.commit()

    except Exception:
        db.rollback()
        raise

 

@router.get("/", response_model=list[ActivoOut], response_model_exclude_none=True)
def listar(db: Session = Depends(get_db)):
    activos = db.query(ActivoTi).all()
    return [build_activo_data(a, db) for a in activos]

    

@router.get("/{id_act}", response_model=ActivoOut, response_model_exclude_none=True)
def obtener (id_act: int, db: Session = Depends(get_db)):
    """Devuelve un activo por id."""
    obt_activo = db.query(ActivoTi).filter(ActivoTi.id_act == id_act).first()
    if obt_activo is None:
        raise  HTTPException(status_code=404, detail="Activo no encontrado")

    return build_activo_data(obt_activo, db)


#################################################################################
# POST- CREAR #
#################################################################################

@router.post("/", response_model=ActivoOut, status_code=status.HTTP_201_CREATED, response_model_exclude_none=True)
def crear(payload: ActivoCreate, db: Session = Depends(get_db)):

    #verificar FK de factura
    if payload.id_fact is not None:
        if db.query(Factura).filter(Factura.id_fact == payload.id_fact).first() is None:
            raise HTTPException(status_code=400, detail="Factura no existe")
    
    #verificar FK de tipo_estado
    if db.query(TipoEstado).filter(TipoEstado.id_tipoe == payload.id_tipoe).first() is None:
        raise HTTPException(status_code=404, detail="Tipo estado no encontrado")
    
    #Resolver clase del subtipo desde el mapa SUBTIPOS
    modelo_subtipo = SUBTIPOS.get(payload.tipo)
    if modelo_subtipo is None:
        raise HTTPException(status_code=400, detail=f"Tipo no soportado: {payload.tipo}")

    #Convertir payload a dict una sola vez
    payload_dict = payload.model_dump()

    #Insertar activo_ti con los campos del padre
    datos_activo = split_payload_por_model(payload_dict, ActivoTi)
    activo = ActivoTi(**datos_activo)
    db.add(activo)
    db.flush()  # ejecuta el INSERT y obtiene id_act, sin cerrar la transacción

    #Insertar el subtipo con solo sus campos + el id_act recién creado
    datos_subtipo = split_payload_por_model(payload_dict, modelo_subtipo)
    datos_subtipo["id_act"] = activo.id_act
    sub = modelo_subtipo(**datos_subtipo)
    db.add(sub)

    #Confirmar toda la transacción
    commit_or_rollback(db)   
    db.refresh(activo)

    # Devolver datos combinados 
    return build_activo_data(activo, db)

 

#################################################################################
# PUT- UPDATE #
#################################################################################

@router.put("/{id_act}", response_model=ActivoOut, response_model_exclude_none=True)
def actualizar(id_act:int, payload: ActivoUpdate, db: Session = Depends(get_db)):

    activo = db.query(ActivoTi).filter(ActivoTi.id_act == id_act).first()

    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    payload_dict = payload.model_dump(exclude_unset=True)

    # PADRE
    for k, v in split_payload_por_model(payload_dict, ActivoTi).items():
        setattr(activo, k, v)

    # SUBTIPO
    modelo_subtipo = SUBTIPOS.get(activo.tipo)

    if modelo_subtipo:

        sub = db.query(modelo_subtipo).filter(modelo_subtipo.id_act == id_act).first()

        if sub:

            for k, v in split_payload_por_model(payload_dict, modelo_subtipo).items():
                setattr(sub, k, v)

    # GUARDAR
    commit_or_rollback(db)

    return build_activo_data(activo, db)


@router.delete ("/{id_act}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_act:int, db: Session = Depends(get_db)):
    eli_act= db.query(ActivoTi).filter(ActivoTi.id_act == id_act).first()
    
    if eli_act is None:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")

    eli_act.disponibilidad=False
    commit_or_rollback(db)

    return None




