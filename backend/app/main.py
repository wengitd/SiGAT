"""Entrypoint FastAPI: factory, lifespan y registro de routers."""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import modules as _models_registry  # noqa: F401 — registra ORM
from app.bootstrap import ensure_admin_user
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import register_exception_handlers
from app.core.middleware import setup_middleware
from app.modules.activos.router import router as activos_router
from app.modules.asignaciones.router import router as asignaciones_router
from app.modules.auth.router import router as auth_router
from app.modules.catalogos.router import router as catalogos_router
from app.modules.checklist.router import router as checklist_router
from app.modules.checklist.router_plantilla import router as plantilla_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.empleados.router import router as empleados_router
from app.modules.facturas.router import router as facturas_router
from app.modules.historial.router import router as historial_router
from app.modules.licencias.router_emp_lic import router as emp_lic_router
from app.modules.solicitudes_baja.router import router as solicitudes_baja_router
from app.modules.trazabilidad.router import router as trazabilidad_router
from app.modules.usuarios.router import router as usuarios_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Al arrancar, asegura el usuario admin declarado en .env."""
    ensure_admin_user()
    yield


def create_app() -> FastAPI:
    """Factory de la aplicación (facilita tests)."""
    application = FastAPI(
        title=settings.app_name,
        description=(
            "API del Sistema de Gestión de Activos Tecnológicos - Forestal Leonera"
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    register_exception_handlers(application)
    setup_middleware(application)

    application.include_router(catalogos_router)
    application.include_router(empleados_router)
    application.include_router(usuarios_router)
    application.include_router(emp_lic_router)
    application.include_router(facturas_router)
    application.include_router(activos_router)
    application.include_router(historial_router)
    application.include_router(asignaciones_router)
    application.include_router(checklist_router)
    application.include_router(plantilla_router)
    application.include_router(auth_router)
    application.include_router(solicitudes_baja_router)
    application.include_router(trazabilidad_router)
    application.include_router(dashboard_router)

    @application.get("/")
    def root():
        """Endpoint raíz: confirma que la app está corriendo."""
        return {
            "app": settings.app_name,
            "version": "0.1.0",
            "status": "ok",
            "env": settings.app_env,
        }

    @application.get("/health")
    def health_check(db: Session = Depends(get_db)):
        """Verifica API viva y conexión a BD."""
        try:
            result = db.execute(text("SELECT 1")).scalar()
            if result == 1:
                return {"status": "ok", "database": "connected"}
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Database connection failed: {str(e)}",
            )

    return application


app = create_app()
