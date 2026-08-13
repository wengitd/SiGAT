"""Lógica de negocio de autenticación."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import AppError, ForbiddenError, NotFoundError
from app.core.security import create_access_token, verify_password
from app.modules.auth.schemas import LoginResult, TokenResponse
from app.modules.usuarios.models import UsuarioSistema


def authenticate_user(db: Session, email: str, password: str) -> LoginResult:
    """Valida credenciales y retorna datos del usuario autenticado."""
    usuario = (
        db.query(UsuarioSistema)
        .filter(func.lower(UsuarioSistema.email) == email.lower().strip())
        .first()
    )
    if not usuario:
        raise NotFoundError("Usuario no encontrado")

    if not verify_password(password, usuario.hash_pass):
        raise AppError("Contraseña incorrecta", status_code=401)

    if not usuario.vigente:
        raise ForbiddenError("Usuario desactivado")

    return LoginResult(
        id_usuario=usuario.id_usuario,
        rol=usuario.rol,
        nombre=usuario.nombre,
        email=usuario.email,
    )


def issue_token_for_user(usuario: UsuarioSistema | LoginResult) -> TokenResponse:
    """Emite access token JWT para un usuario autenticado."""
    token = create_access_token(
        {
            "sub": str(usuario.id_usuario),
            "rol": usuario.rol,
            "nombre": usuario.nombre,
            "email": str(usuario.email),
        }
    )
    return TokenResponse(access_token=token, token_type="bearer")
