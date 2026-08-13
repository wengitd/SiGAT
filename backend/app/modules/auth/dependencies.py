"""Dependencias de autenticación y autorización por rol."""

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.modules.usuarios.models import UsuarioSistema

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> UsuarioSistema:
    """Extrae y valida el usuario vigente desde el Bearer token."""
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    id_usuario = int(payload["sub"])
    usuario = (
        db.query(UsuarioSistema)
        .filter(UsuarioSistema.id_usuario == id_usuario)
        .first()
    )

    if not usuario or not usuario.vigente:
        raise HTTPException(status_code=401, detail="Usuario no autorizado")
    return usuario


def require_admin(current_user: UsuarioSistema = Depends(get_current_user)) -> UsuarioSistema:
    if current_user.rol != "Admin":
        raise HTTPException(status_code=403, detail="Se requiere rol Administrador")
    return current_user


def require_editor(current_user: UsuarioSistema = Depends(get_current_user)) -> UsuarioSistema:
    if current_user.rol not in ("Editor", "Admin"):
        raise HTTPException(
            status_code=403, detail="Se requiere rol Editor o Administrador"
        )
    return current_user
