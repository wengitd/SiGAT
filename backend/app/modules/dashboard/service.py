"""Orquestación del resumen de dashboard y helpers de rangos de antigüedad."""

from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.dashboard import repository as repo

ANIO_MIN = 2000
ANIO_MAX = 2100

RANGOS_ANTIGUEDAD = (
    "Menos de 3 años",
    "Entre 3 a 5 años",
    "Entre 5 a 7 años",
    "Más de 7 años",
)


def activo_en_periodo(
    fecha_recep: date | None, anio: int, hoy: date | None = None
) -> bool:
    """True si el activo cuenta en el año: recibido ese año, o sin fecha en el año actual."""
    referencia = hoy or date.today()
    if fecha_recep is None:
        return anio == referencia.year
    return fecha_recep.year == anio


def validar_anio(anio: int | None) -> int:
    """Resuelve el año del periodo (default: año actual) y valida el rango."""
    anio_consulta = anio or date.today().year
    if anio_consulta < ANIO_MIN or anio_consulta > ANIO_MAX:
        raise HTTPException(
            status_code=422,
            detail=f"El año debe estar entre {ANIO_MIN} y {ANIO_MAX}.",
        )
    return anio_consulta


def rango_antiguedad(fecha_recep: date | None, hoy: date | None = None) -> str | None:
    """Clasifica un activo en un rango de edad a partir de fecha_recep."""
    if fecha_recep is None:
        return None
    referencia = hoy or date.today()
    anios = referencia.year - fecha_recep.year
    if (referencia.month, referencia.day) < (fecha_recep.month, fecha_recep.day):
        anios -= 1
    if anios < 3:
        return RANGOS_ANTIGUEDAD[0]
    if anios < 5:
        return RANGOS_ANTIGUEDAD[1]
    if anios < 7:
        return RANGOS_ANTIGUEDAD[2]
    return RANGOS_ANTIGUEDAD[3]


def completar_rangos_antiguedad(filas: list[dict]) -> list[dict]:
    """Garantiza los cuatro rangos, con cero si el año no tiene activos."""
    por_rango = {fila["rango"]: fila["total"] for fila in filas}
    return [
        {"rango": rango, "total": por_rango.get(rango, 0)}
        for rango in RANGOS_ANTIGUEDAD
    ]


def obtener_resumen(db: Session, anio: int | None) -> dict:
    """Arma el payload del dashboard aplicando el mismo año a todas las métricas."""
    anio_consulta = validar_anio(anio)
    return {
        "anio": anio_consulta,
        "activos": repo.contar_kpis(db, anio_consulta),
        "activos_por_tipo": repo.activos_por_tipo(db, anio_consulta),
        "activos_por_antiguedad": completar_rangos_antiguedad(
            repo.activos_por_antiguedad(db, anio_consulta)
        ),
        "licencias_por_tipo": repo.licencias_por_tipo(db, anio_consulta),
        "activos_por_estado": repo.activos_por_estado(db, anio_consulta),
    }
