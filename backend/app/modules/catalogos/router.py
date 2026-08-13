"""Agregador de routers de catálogos CRUD."""

from fastapi import APIRouter

from app.modules.catalogos.router_cargo import router as cargo_router
from app.modules.catalogos.router_disponibilidad import router as disponibilidad_router
from app.modules.catalogos.router_dpto import router as dpto_router
from app.modules.catalogos.router_empresa import router as empresa_router
from app.modules.catalogos.router_marca import router as marca_router
from app.modules.catalogos.router_modelo import router as modelo_router
from app.modules.catalogos.router_planta import router as planta_router
from app.modules.catalogos.router_proveedor_licencia import (
    router as proveedor_licencia_router,
)
from app.modules.catalogos.router_sistema_operativo import (
    router as sistema_operativo_router,
)
from app.modules.catalogos.router_sub_area import router as sub_area_router
from app.modules.catalogos.router_tipo_equipo import router as tipo_equipo_router
from app.modules.catalogos.router_tipo_estado import router as tipo_estado_router
from app.modules.catalogos.router_tipo_periferico import (
    router as tipo_periferico_router,
)
from app.modules.catalogos.router_version_licencia import (
    router as version_licencia_router,
)

router = APIRouter()
router.include_router(tipo_estado_router)
router.include_router(dpto_router)
router.include_router(empresa_router)
router.include_router(cargo_router)
router.include_router(planta_router)
router.include_router(tipo_equipo_router)
router.include_router(sistema_operativo_router)
router.include_router(tipo_periferico_router)
router.include_router(proveedor_licencia_router)
router.include_router(version_licencia_router)
router.include_router(sub_area_router)
router.include_router(disponibilidad_router)
router.include_router(marca_router)
router.include_router(modelo_router)
