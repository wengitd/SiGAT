"""Persistencia local de PDFs de factura en el volumen Docker."""

from datetime import datetime
from pathlib import Path

from fastapi import HTTPException, UploadFile

from config import settings

MAX_PDF_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"application/pdf"}


def _root() -> Path:
    root = Path(settings.facturas_storage_path)
    root.mkdir(parents=True, exist_ok=True)
    return root.resolve()


def _activo_dir(id_act: int) -> Path:
    directory = _root() / f"activo_{id_act}"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def absolute_path(ruta_relativa: str) -> Path:
    """Resuelve una ruta relativa almacenada en BD hacia el volumen."""
    root = _root()
    resolved = (root / ruta_relativa).resolve()
    if not str(resolved).startswith(str(root)):
        raise HTTPException(status_code=400, detail="Ruta de factura inválida")
    return resolved


async def validate_pdf(file: UploadFile) -> bytes:
    """Valida tipo/tamaño y retorna el contenido del PDF."""
    content_type = (file.content_type or "").lower()
    filename = (file.filename or "").lower()
    if content_type not in ALLOWED_CONTENT_TYPES and not filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos PDF",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="El archivo PDF está vacío")
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=400,
            detail="El PDF supera el tamaño máximo permitido (10 MB)",
        )
    if not data.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="El archivo no es un PDF válido")
    return data


def save_pdf(id_act: int, data: bytes) -> str:
    """
    Guarda el PDF y retorna la ruta relativa para BD.
    Ejemplo: activo_42/factura_20260805_162530.pdf
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"factura_{timestamp}.pdf"
    destino = _activo_dir(id_act) / filename
    destino.write_bytes(data)
    return f"activo_{id_act}/{filename}"


def delete_pdf(ruta_relativa: str | None) -> None:
    """Elimina el archivo si existe; ignora rutas vacías o inexistentes."""
    if not ruta_relativa:
        return
    try:
        path = absolute_path(ruta_relativa)
    except HTTPException:
        return
    if path.is_file():
        path.unlink()
