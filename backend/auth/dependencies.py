from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from models.usuario_sistema_model import UsuarioSistema
from sqlalchemy.orm import Session

from auth.jwt import decode_token
from database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# extrae y valida el token---------------------------------------------------|
def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    try:
        var_token = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    id_usuario = int(var_token["sub"])
    usuario = (
        db.query(UsuarioSistema)
        .filter(UsuarioSistema.id_usuario == id_usuario)
        .first()
    )

    if not usuario or not usuario.vigente:
        raise HTTPException(status_code=401, detail="Usuario no autorizado")
    return usuario


def require_admin(current_user=Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Se requiere rol Administrador")
    return current_user


def require_editor(current_user=Depends(get_current_user)):
    if current_user.rol not in ("editor", "admin"):
        raise HTTPException(
            status_code=403, detail="Se requiere rol Editor o Administrador"
        )
    return current_user
