from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from fastapi.middleware.cors import CORSMiddleware #CORS bloqueaba conexion con frontend


from auth.router import router as auth_router #carpeta creada para jwt
#de la carpeta auth/, del archivo router.py, importa la variable router

from routes import (
    tipo_estado_route,
    dpto_route,
    empleado_route,
    usuario_sistema_route,
    licencia_route,
    emp_lic_route,
    factura_route,
    activo_route,
    historial_estado_route,
    asignacion_route,
    checklist_route,
    plantilla_route,
    check_plantilla_route,
    empresa_route,
    cargo_route,
    planta_route,
    tipo_equipo_route,
    sistema_operativo_route,
    tipo_periferico_route,
    proveedor_licencia_route,
    proveedor_factura_route,
    version_licencia_route,
    sub_area_route,
    disponibilidad_route,
    marca_route,
    modelo_route,
    solicitud_baja_route,
)

# Inicialización de la app  
app = FastAPI(
    title=settings.app_name,
    description="API del Sistema de Gestión de Activos Tecnológicos - Forestal Leonera",
    version="0.1.0",
)

app.include_router(tipo_estado_route.router)
app.include_router(dpto_route.router)
app.include_router(empleado_route.router)
app.include_router(usuario_sistema_route.router)
app.include_router(licencia_route.router)
app.include_router(emp_lic_route.router)
app.include_router(factura_route.router)
app.include_router(activo_route.router)
app.include_router(historial_estado_route.router)
app.include_router(asignacion_route.router)
app.include_router(checklist_route.router)
app.include_router(plantilla_route.router)
app.include_router(check_plantilla_route.router)
app.include_router(empresa_route.router)
app.include_router(cargo_route.router)
app.include_router(planta_route.router)
app.include_router(tipo_equipo_route.router)
app.include_router(sistema_operativo_route.router)
app.include_router(tipo_periferico_route.router)
app.include_router(proveedor_licencia_route.router)
app.include_router(proveedor_factura_route.router)
app.include_router(version_licencia_route.router)
app.include_router(sub_area_route.router)
app.include_router(auth_router)
app.include_router(disponibilidad_route.router)
app.include_router(marca_route.router)
app.include_router(modelo_route.router)
app.include_router(solicitud_baja_route.router)

#middleware que responde con en el header access-control-allow-origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



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