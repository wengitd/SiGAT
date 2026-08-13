"""Creación idempotente del usuario administrador inicial desde .env."""

import logging

from sqlalchemy import func

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.modules.usuarios.models import UsuarioSistema

logger = logging.getLogger(__name__)


def ensure_admin_user() -> None:
    """Asegura la existencia y actualización del hash del UsuarioSistema admin."""
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
            usuario.hash_pass = hash_password(settings.admin_password)
            usuario.vigente = True
            usuario.rol = "Admin"
            db.commit()
            logger.info("Usuario admin verificado y actualizado: %s", settings.admin_user)
            return

        db.add(
            UsuarioSistema(
                nombre="Administrador",
                email=settings.admin_user.lower(),
                hash_pass=hash_password(settings.admin_password),
                rol="Admin",
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
