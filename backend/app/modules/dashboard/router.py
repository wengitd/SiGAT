from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.dashboard.schemas import ResumenDashboard
from app.modules.dashboard.service import obtener_resumen

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/resumen", response_model=ResumenDashboard)
def resumen(
    anio: Optional[int] = Query(None, description="Año del periodo (default: año actual)"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Datos agregados del Dashboard filtrados por año de recepción / asignación."""
    return obtener_resumen(db, anio)
