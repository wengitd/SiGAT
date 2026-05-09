from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from database import get_db


from routes import tipo_estado as tipo_estado_routes

# Inicialización de la app
app = FastAPI(
    title=settings.app_name,
    description="API del Sistema de Gestión de Activos Tecnológicos - Forestal Leonera",
    version="0.1.0",
)

app.include_router(tipo_estado_routes.router)

# Endpoint raíz: confirma que la app está corriendo.
@app.get("/")
def root():
    """Endpoint raíz: confirma que la app está corriendo."""
    return {
        "app": settings.app_name,
        "version": "0.1.0",
        "status": "ok",
        "env": settings.app_env,
    }


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Verifica que la API esté viva y que pueda conectarse a la BD.
    Útil para monitoreo en producción.
    """
    try:
        # Ejecuta una query simple solo para probar la conexión
        result = db.execute(text("SELECT 1")).scalar()
        if result == 1:
            return {"status": "ok", "database": "connected"}
    except Exception as e:
        # Si la conexión falla, devuelve un error 503
        raise HTTPException(
            status_code=503,
            detail=f"Database connection failed: {str(e)}",
        )