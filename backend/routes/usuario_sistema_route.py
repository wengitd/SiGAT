from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext #libreria para hash pass
from auth.dependencies import get_current_user, require_editor


from database import get_db
from models.empleado_model import UsuarioSistema
from models.empleado_model import Empleado

from schemas.empleado_schema import UsuarioSistemaCreate, UsuarioSistemaUpdate, UsuarioSistemaOut

router=APIRouter(prefix="/usuario_sistema", tags=["Usuarios del sistema"])

#objeto que sabe hashear y verificar pass
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


@router.get("/", response_model=list[UsuarioSistemaOut],)
def listar (db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    "Muestra todos los usuarios del sistema."
    #return.db.query(model.py)
    return db.query(UsuarioSistema).all()

@router.get("/{id_emp}", response_model=UsuarioSistemaOut)
def obtener (id_emp: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve un usuario del sistema por id."""

    #variable = db.query(model).filter(model.id == id).first()
    inf = db.query(UsuarioSistema).filter(UsuarioSistema.id_emp == id_emp).first()
    if inf is None:
        raise  HTTPException(status_code=404, detail="Usuario no encontrado")
    return inf

@router.post("/", response_model=UsuarioSistemaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: UsuarioSistemaCreate, db: Session = Depends(get_db)):

    #verificar que empleado existe
    emp = db.query(Empleado).filter(Empleado.id_emp == payload.id_emp).first()
    if emp is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    #verificar que no sea ya un usuario del sistema (para no duplicar PK)
    inf=db.query(UsuarioSistema).filter(UsuarioSistema.id_emp == payload.id_emp).first()
    if inf is not None:
        raise HTTPException(status_code=400, detail="Este empleado ya es usuario del sistema")

    #hashear la pass
    hash_pass=pwd_context.hash(payload.password)

    #crear el objeto SQLAlchemy con el hash no con pass
    nuevo_inf=UsuarioSistema(
        id_emp=payload.id_emp,
        hash_pass=hash_pass,
        rol=payload.rol,
        vigente=payload.vigente
    )

    #guardar
    db.add(nuevo_inf)
    db.commit()
    db.refresh(nuevo_inf)
    return nuevo_inf

@router.put("/{id_emp}", response_model=UsuarioSistemaOut)
def actualizar(id_emp:int, payload: UsuarioSistemaUpdate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    #variable=db.query(model.py).filter(model.id_model==id_model).first()
    act_inf = db.query(UsuarioSistema).filter(UsuarioSistema.id_emp == id_emp).first()

    if act_inf is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    datos= payload.model_dump(exclude_unset=True)

    #si el cliente envia password, se hashea y renombra la clave a hash_pass
    if "password" in datos:
        datos["hash_pass"] = pwd_context.hash(datos.pop("password"))

    #sino, solo cambia el rol.

    #"datos" contiene hash_pass,rol, pero no password
    #cuando el for itere datos, va a tener hash_pass y rol
    for campo, valor in datos.items():
        setattr(act_inf,campo,valor)

    db.commit()
    db.refresh(act_inf)
    return act_inf

@router.delete ("/{id_emp}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_emp:int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    eli_inf= db.query(UsuarioSistema).filter(UsuarioSistema.id_emp == id_emp).first()

    if eli_inf is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    eli_inf.vigente = False
    db.commit()

    return None
