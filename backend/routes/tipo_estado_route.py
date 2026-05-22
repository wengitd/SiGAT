from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.tipo_estado_model import TipoEstado
from schemas.tipo_estado_schema import TipoEstadoCreate, TipoEstadoUpdate, TipoEstadoOut

#Agrupa endpoints relacionados.
#El prefijo hace que todas las rutas debajo empiecen con /tipo_estado
router = APIRouter(prefix="/tipos-estado", tags=["tipos_estado"])


#get listar 
@router.get("/", response_model=list[TipoEstadoOut])
def listar(db: Session = Depends(get_db)):
    """Devuelve todos los tipos de estado."""
    return db.query(TipoEstado).all()


#get por id
@router.get("/{id_tipoe}", response_model=TipoEstadoOut)
def obtener(id_tipoe: int, db: Session = Depends(get_db)):
    """Devuelve un tipo de estado por id."""
    tipo = db.query(TipoEstado).filter(TipoEstado.id_tipoe == id_tipoe).first()
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de estado no encontrado")
    return tipo


@router.post("/", response_model=TipoEstadoOut, status_code=status.HTTP_201_CREATED)
def crear(payload: TipoEstadoCreate, db: Session = Depends(get_db)):

    # 1. Convertir el payload Pydantic a un dict, y desempaquetarlo en el constructor del modelo
    nuevo_tipo = TipoEstado(**payload.model_dump())

    # 2. Marcarlo para insertar
    db.add(nuevo_tipo)
    
    # 3. Confirmar el INSERT en la BD
    db.commit()
    
    # 4. Recargar el objeto desde la BD (ahora tiene el id_tipoe que generó el SERIAL)
    db.refresh(nuevo_tipo)
    
    # 5. Devolverlo (FastAPI lo convertirá a TipoEstadoOut gracias al response_model)
    return nuevo_tipo


#ACTUALIZAR
@router.put("/{id_tipoe}", response_model=TipoEstadoOut)
def actualizar(id_tipoe: int, payload: TipoEstadoUpdate, db: Session = Depends(get_db)):
    # Buscar el registro (igual que en obtener); si no existe, 404
    act_tipo= db.query(TipoEstado).filter(TipoEstado.id_tipoe == id_tipoe).first()

    if act_tipo is None:
        raise HTTPException(status_code=404, detail="No encontrado")
    

    # Iterar payload.model_dump(exclude_unset=True) y setear los atributos en el objeto
    datos= payload.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        #setattr(objeto, "atributo", valor)
        setattr(act_tipo,campo,valor)
    
    #  db.commit() + db.refresh()
    db.commit()
    db.refresh(act_tipo)

    # retornar
    return act_tipo


#ELIMINAR
@router.delete("/{id_tipoe}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_tipoe:int, db: Session = Depends(get_db)):
    eli_tipo=db.query(TipoEstado).filter(TipoEstado.id_tipoe == id_tipoe).first()

    if eli_tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de estado no encontrado")


    eli_tipo.operatividad=False
    db.commit()

    return None



