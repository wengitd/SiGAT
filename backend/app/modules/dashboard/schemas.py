from pydantic import BaseModel


class ActivosResumen(BaseModel):
    total: int
    equipos_disponibles: int
    equipos_asignados: int
    dados_de_baja: int


class TipoTotal(BaseModel):
    tipo: str
    total: int


class AntiguedadTotal(BaseModel):
    rango: str
    total: int


class LicenciaTipoTotal(BaseModel):
    tipo: str
    asignadas: int
    total_equipos_computo: int


class EstadoTotal(BaseModel):
    estado: str
    total: int


class ResumenDashboard(BaseModel):
    anio: int
    activos: ActivosResumen
    activos_por_tipo: list[TipoTotal]
    activos_por_antiguedad: list[AntiguedadTotal]
    licencias_por_tipo: list[LicenciaTipoTotal]
    activos_por_estado: list[EstadoTotal]
