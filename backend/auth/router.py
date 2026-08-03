from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from models.usuario_sistema_model import UsuarioSistema
from passlib.context import CryptContext
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from auth.jwt import create_access_token
from database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    usuario = (
        db.query(UsuarioSistema)
        .filter(func.lower(UsuarioSistema.email) == form.username.lower().strip())
        .first()
    )

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    try:
        es_valido = pwd_context.verify(form.password, usuario.hash_pass)
    except Exception:
        es_valido = False

    if not es_valido:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    if not usuario.vigente:
        raise HTTPException(status_code=403, detail="Usuario desactivado")

    token = create_access_token(
        {
            "sub": str(usuario.id_usuario),
            "rol": usuario.rol,
            "nombre": usuario.nombre,
            "email": usuario.email,
        }
    )
    return {"access_token": token, "token_type": "bearer"}


@router.post("/renew")
def renew(current_user: UsuarioSistema = Depends(get_current_user)):
    token = create_access_token(
        {
            "sub": str(current_user.id_usuario),
            "rol": current_user.rol,
            "nombre": current_user.nombre,
            "email": current_user.email,
        }
    )
    return {"access_token": token, "token_type": "bearer"}
