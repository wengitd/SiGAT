from pydantic import BaseModel


class ActivosResumen(BaseModel):
    periferico: int
    equipo_computo: int
    adquiridos_anio: int


class ProveedorTotal(BaseModel):
    proveedor: str
    total: int


class FamiliaTotal(BaseModel):
    familia: str
    total: int


class EstadoTotal(BaseModel):
    estado: str
    total: int


class SerieMensual(BaseModel):
    proveedor: str
    data: list[int]


class LicenciasPorMes(BaseModel):
    labels: list[str]
    series: list[SerieMensual]


class ResumenDashboard(BaseModel):
    activos: ActivosResumen
    licencias_totales: list[ProveedorTotal]
    sistemas_operativos: list[FamiliaTotal]
    activos_por_estado: list[EstadoTotal]
    licencias_por_mes: LicenciasPorMes
