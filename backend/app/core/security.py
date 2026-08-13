"""Hasheo de contraseñas y tokens JWT."""

from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    """Genera hash Argon2 de una contraseña en texto plano."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verifica contraseña contra hash; False si el hash es inválido."""
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    """Crea un JWT con expiración según configuración."""
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """Decodifica y valida un JWT; lanza JWTError si es inválido."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
