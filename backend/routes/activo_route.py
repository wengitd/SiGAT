from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.activo_ti_model import ActivoTi, EquipoComputo, Periferico, SistemaOperativo, TipoEquipo, TipoPeriferico, Disponibilidad
from schemas.activo_schema  import ActivoBase, ActivoCreate, ActivoUpdate, ActivoOut

from models.empleado_model import Empleado
from models.asignacion_model import Asignacion
from models.factura_model import Factura
from models.tipo_estado_model import TipoEstado

router=APIRouter(prefix="/ActivoTi", tags=["Activos"])

SUBTIPOS = {
    "equipo_computo": EquipoComputo,
    "periferico": Periferico
}

REGLAS_INCOMPATIBLES = {
    "bueno":   {"de_baja", "en_mantencion"},
    "regular": {"de_baja"},
    "malo":    set(),
}

#funcion helper para estado y disponibilidad

def validar_dispo_estado(id_dispo: int, id_tipoe: int, db: Session):
    dispo  = db.query(Disponibilidad).filter(Disponibilidad.id_dispo == id_dispo).first()
    estado = db.query(TipoEstado).filter(TipoEstado.id_tipoe == id_tipoe).first()

    if not dispo or not estado:
        return  # las FKs ya se validan antes

    no_permitidas = REGLAS_INCOMPATIBLES.get(estado.nombre.lower(), set())

    if dispo.nombre.lower() in no_permitidas:
        raise HTTPException(
            status_code=400,
            detail=f"Un activo '{estado.nombre}' no puede estar '{dispo.nombre}'"
        )

#funciones helper
def to_dict(obj):
    """
    Convierte un objeto SQLAlchemy en un diccionario,
    utilizando las columnas definidas en su modelo.
    """
    # Si el objeto no existe, retorna diccionario vacío
    if obj is None:
        return {}    
    return {col.name: getattr(obj, col.name) for col in obj.__table__.columns}

def build_activo_data(activo_model:ActivoTi, db:Session)->dict:
    """
    Construye un diccionario completo de un activo,
    combinando datos del modelo principal y su subtipo.

    Ademas, se traen los atributos necesarios para un escenario completo 
    de un activo

    Se reutiliza en: create, read, list.
    """
    # Convierte el modelo principal a dict
    data = to_dict(activo_model)

    # Obtiene el modelo subtipo según el tipo de activo
    modelo_subtipo=SUBTIPOS.get(activo_model.tipo)

    if modelo_subtipo:
        #Busca el registro del subtipo relacionado
        sub = db.query(modelo_subtipo).filter(modelo_subtipo.id_act == activo_model.id_act).first()
        #Si existe subtipo, lo mezcla con el diccionario principal
        if sub:
            data.update(to_dict(sub))
            #agregar sistema operativo
            if sub and hasattr(sub, 'id_so') and sub.id_so is not None:
                so = db.query(SistemaOperativo).filter(SistemaOperativo.id_so == sub.id_so).first()
                if so:
                    data["nombre_so"] = so.nombre
            
            # agregar el tipo de equipo segun periferico o computacional
            if sub and hasattr(sub, 'id_tipoeq') and sub.id_tipoeq is not None:
                tipoeq = db.query(TipoEquipo).filter(TipoEquipo.id_tipoeq == sub.id_tipoeq).first()
                if tipoeq:
                    data["nombre_tipoeq"] = tipoeq.nombre

            if sub and hasattr(sub, 'id_tipoper') and sub.id_tipoper is not None:
                tipoper = db.query(TipoPeriferico).filter(TipoPeriferico.id_tipoper == sub.id_tipoper).first()
                if tipoper:
                    data["nombre_tipoper"] = tipoper.nombre

    # Estado del activo
    estado = db.query(TipoEstado).filter(TipoEstado.id_tipoe == activo_model.id_tipoe).first()
    if estado:
        data["nombre_estado"] = estado.nombre

    # Empleado asignado (última asignación activa = sin fecha_dev)
    asignacion = (db.query(Asignacion).filter(Asignacion.id_act == activo_model.id_act, Asignacion.fecha_dev == None).order_by(Asignacion.fecha_entr.desc()).first())
    if asignacion:
        empleado = db.query(Empleado).filter(Empleado.id_emp == asignacion.id_emp).first()
        if empleado:
            data["empleado_asignado"] = empleado.nombre

    #Disponibilidad del activo
    dispo = db.query(Disponibilidad).filter(Disponibilidad.id_dispo == activo_model.id_dispo).first()
    if dispo:
        data["nombre_dispo"] = dispo.nombre
        data["dispo_color"]  = dispo.color or "default"


    #Para obtener la ruta de la factura
    if activo_model.id_fact is not None:
        factura = db.query(Factura).filter(Factura.id_fact == activo_model.id_fact).first()
        if factura:
            data["ruta_pdf_fact"] = factura.ruta_pdf_fact
    
    return data

# Evita asignar atributos inexistentes al modelo SQLAlchemy.
def split_payload_por_model(payload_dict: dict, model_class) -> dict:

    # Obtiene nombres de columnas del modelo
    columnas = {col.name for col in model_class.__table__.columns}
    # Retorna solo claves válidas para el modelo
    return {k: v for k, v in payload_dict.items() if k in columnas}

# Helper
# Confirma cambios en la base de datos.
# Ante cualquier error, revierte la transacción para mantener integridad.
def commit_or_rollback(db: Session):
    try:
        db.commit()

    except Exception:
        db.rollback()
        raise

 

@router.get("/", response_model=list[ActivoOut], response_model_exclude_none=True)
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    activos = db.query(ActivoTi).all()
    return [build_activo_data(a, db) for a in activos]

    

@router.get("/{id_act}", response_model=ActivoOut, response_model_exclude_none=True)
def obtener (id_act: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve un activo por id."""
    obt_activo = db.query(ActivoTi).filter(ActivoTi.id_act == id_act).first()
    if obt_activo is None:
        raise  HTTPException(status_code=404, detail="Activo no encontrado")

    return build_activo_data(obt_activo, db)



@router.post("/", response_model=ActivoOut, status_code=status.HTTP_201_CREATED, response_model_exclude_none=True)
def crear(payload: ActivoCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):

    # ---------- VALIDACIONES FK ----------
    # Verifica existencia de factura si fue enviada
    if payload.id_fact is not None:
        if db.query(Factura).filter(Factura.id_fact == payload.id_fact).first() is None:
            raise HTTPException(status_code=400, detail="Factura no existe")
    
    # Verifica existencia del tipo de estado
    if db.query(TipoEstado).filter(TipoEstado.id_tipoe == payload.id_tipoe).first() is None:
        raise HTTPException(status_code=404, detail="Tipo estado no encontrado")
    
    # Verifica FKs de subtipo
    if payload.tipo == "equipo_computo":
        if payload.id_tipoeq is not None:
            if db.query(TipoEquipo).filter(TipoEquipo.id_tipoeq == payload.id_tipoeq).first() is None:
                raise HTTPException(status_code=400, detail="Tipo de equipo no existe")
        if payload.id_so is not None:
            if db.query(SistemaOperativo).filter(SistemaOperativo.id_so == payload.id_so).first() is None:
                raise HTTPException(status_code=400, detail="Sistema operativo no existe")
    elif payload.tipo == "periferico":
        if payload.id_tipoper is not None:
            if db.query(TipoPeriferico).filter(TipoPeriferico.id_tipoper == payload.id_tipoper).first() is None:
                raise HTTPException(status_code=400, detail="Tipo de periférico no existe")

    #------------REGLA DISPONIBLE - TIPOESTADO--
    validar_dispo_estado(payload.id_dispo, payload.id_tipoe, db)

    # ---------- RESOLUCIÓN DE SUBTIPO ----------
    
    # Obtiene dinámicamente la clase subtipo según el tipo de activo
    modelo_subtipo = SUBTIPOS.get(payload.tipo)
    if modelo_subtipo is None:
        raise HTTPException(status_code=400, detail=f"Tipo no soportado: {payload.tipo}")
    
    # Convierte el payload a dict una sola vez
    payload_dict = payload.model_dump()

    # ---------- CREAR MODELO PADRE ----------
    # Extrae únicamente los campos pertenecientes a ActivoTi
    datos_activo = split_payload_por_model(payload_dict, ActivoTi)
    activo = ActivoTi(**datos_activo)
    db.add(activo)
    db.flush()  

    # ---------- CREAR SUBTIPO ----------
    # Extrae únicamente los campos del subtipo
    datos_subtipo = split_payload_por_model(payload_dict, modelo_subtipo)
    # Relaciona el subtipo con el activo recién creado
    datos_subtipo["id_act"] = activo.id_act
    sub = modelo_subtipo(**datos_subtipo)
    db.add(sub)

    # ---------- CONFIRMAR TRANSACCIÓN ----------
    # Guarda padre y subtipo en una sola transacción
    commit_or_rollback(db)   
    db.refresh(activo)

    # Devolver datos combinados 
    return build_activo_data(activo, db)

 

# Actualiza parcialmente un activo TI y su subtipo asociado----------------------
@router.put("/{id_act}", response_model=ActivoOut, response_model_exclude_none=True)
def actualizar(id_act:int, payload: ActivoUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    activo = db.query(ActivoTi).filter(ActivoTi.id_act == id_act).first()

    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    
    # Verifica FKs de subtipo según tipo del activo
    if activo.tipo == "equipo_computo":
        if payload.id_tipoeq is not None:
            if db.query(TipoEquipo).filter(TipoEquipo.id_tipoeq == payload.id_tipoeq).first() is None:
                raise HTTPException(status_code=400, detail="Tipo de equipo no existe")
        if payload.id_so is not None:
            if db.query(SistemaOperativo).filter(SistemaOperativo.id_so == payload.id_so).first() is None:
                raise HTTPException(status_code=400, detail="Sistema operativo no existe")
    elif activo.tipo == "periferico":
        if payload.id_tipoper is not None:
            if db.query(TipoPeriferico).filter(TipoPeriferico.id_tipoper == payload.id_tipoper).first() is None:
                raise HTTPException(status_code=400, detail="Tipo de periférico no existe")
    
    # Convierte el payload a dict excluyendo campos no enviado
    payload_dict = payload.model_dump(exclude_unset=True)

    # ---------------- PADRE ----------------
    # Actualiza únicamente los campos pertenecientes al modelo principal ActivoTi
    for k, v in split_payload_por_model(payload_dict, ActivoTi).items():
        setattr(activo, k, v)

    # ---------------- SUBTIPO ----------------
    # Obtiene dinámicamente el modelo subtipo según el tipo de activo
    modelo_subtipo = SUBTIPOS.get(activo.tipo)

    if modelo_subtipo:
        # Busca el registro subtipo relacionado
        sub = db.query(modelo_subtipo).filter(modelo_subtipo.id_act == id_act).first()
        if sub:
            # Actualiza únicamente los campos del subtipo
            for k, v in split_payload_por_model(payload_dict, modelo_subtipo).items():
                setattr(sub, k, v)

    nuevo_id_dispo = payload.id_dispo if payload.id_dispo is not None else activo.id_dispo
    nuevo_id_tipoe = payload.id_tipoe if payload.id_tipoe is not None else activo.id_tipoe
    validar_dispo_estado(nuevo_id_dispo, nuevo_id_tipoe, db)

    commit_or_rollback(db)
    return build_activo_data(activo, db)

# Soft delete de activos TI.
# El registro no se elimina físicamente para mantener trazabilidad.
@router.delete ("/{id_act}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_act:int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    eli_act= db.query(ActivoTi).filter(ActivoTi.id_act == id_act).first()
    if eli_act is None:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    eli_act.disponibilidad=False
    commit_or_rollback(db)

    return None




