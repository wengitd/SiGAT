from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from auth.jwt import decode_token
from sqlalchemy.orm import Session


from database import get_db
from fastapi import Depends, HTTPException

from models.empleado_model import Informatico

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

#extrae y valida el token---------------------------------------------------|
def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    try:
        var_token= decode_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    id_emp=int(var_token["sub"])
    inf= db.query(Informatico).filter(Informatico.id_emp==var_token.id_emp).first()

    if not inf or not inf.vigente:
        raise HTTPException(status_code=401, detail="Usuario no autorizado")
    return inf
     


def require_editor(current_user = Depends(get_current_user)):
    if current_user.rol != "editor":
        raise HTTPException(status_code=403, detail="Se requiere rol editor")
    return current_user