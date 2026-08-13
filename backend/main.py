"""Shim de compatibilidad: uvicorn main:app sigue funcionando."""

from app.main import app

__all__ = ["app"]
