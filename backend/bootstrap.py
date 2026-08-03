"""Creación idempotente del usuario administrador inicial desde .env."""

import logging

from passlib.context import CryptContext
from sqlalchemy import func

from config import settings
from database import SessionLocal
from models.usuario_sistema_model import UsuarioSistema

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def ensure_admin_user() -> None:
    """Asegura la existencia y actualización del hash del UsuarioSistema admin según variables .env."""
    if not settings.admin_user or not settings.admin_password:
        logger.info("Admin bootstrap omitido: ADMIN_USER o ADMIN_PASSWORD no definidos")
        return

    db = SessionLocal()
    try:
        usuario = (
            db.query(UsuarioSistema)
            .filter(func.lower(UsuarioSistema.email) == settings.admin_user.lower())
            .first()
        )

        if usuario is not None:
            # Actualiza el hash para asegurar un formato Argon2 válido en todo arranque
            usuario.hash_pass = pwd_context.hash(settings.admin_password)
            usuario.vigente = True
            usuario.rol = "admin"
            db.commit()
            logger.info("Usuario admin verificado y actualizado: %s", settings.admin_user)
            return

        db.add(
            UsuarioSistema(
                nombre="Administrador",
                email=settings.admin_user.lower(),
                hash_pass=pwd_context.hash(settings.admin_password),
                rol="admin",
                vigente=True,
            )
        )
        db.commit()
        logger.info("Usuario admin creado: %s", settings.admin_user)
    except Exception:
        db.rollback()
        logger.exception("Error al crear o actualizar el usuario admin inicial")
        raise
    finally:
        db.close()
