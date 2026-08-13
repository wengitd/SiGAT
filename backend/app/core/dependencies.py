"""Inyecciones de dependencia globales (sesión DB)."""

from app.core.database import get_db

__all__ = ["get_db"]
