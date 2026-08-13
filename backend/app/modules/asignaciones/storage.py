"""Persistencia local de actas de entrega (PDF o imagen) en el volumen Docker."""

from datetime import datetime
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import settings

MAX_BYTES = 10 * 1024 * 1024  # 10 MB

ALLOWED_CONTENT_TYPES = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

EXTENSION_TO_MEDIA = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def _root() -> Path:
    root = Path(settings.actas_storage_path)
    root.mkdir(parents=True, exist_ok=True)
    return root.resolve()


def _asig_dir(id_asig: int) -> Path:
    directory = _root() / f"asig_{id_asig}"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def absolute_path(ruta_relativa: str) -> Path:
    """Resuelve una ruta relativa almacenada en BD hacia el volumen."""
    root = _root()
    resolved = (root / ruta_relativa).resolve()
    if not str(resolved).startswith(str(root)):
        raise HTTPException(status_code=400, detail="Ruta de acta inválida")
    return resolved


def media_type_from_ruta(ruta_relativa: str) -> str:
    """Infiere el Content-Type a partir de la extensión del archivo guardado."""
    ext = Path(ruta_relativa).suffix.lower()
    return EXTENSION_TO_MEDIA.get(ext, "application/octet-stream")


def _detect_ext(data: bytes) -> str:
    """Valida magic bytes y retorna la extensión canónica a guardar."""
    if data.startswith(b"%PDF"):
        return "pdf"
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"

    raise HTTPException(
        status_code=400,
        detail="El archivo no es un PDF o imagen válida (JPG, PNG, WEBP)",
    )


async def validate_acta(file: UploadFile) -> tuple[bytes, str]:
    """Valida tipo/tamaño y retorna (contenido, extensión canónica)."""
    content_type = (file.content_type or "").lower()
    filename = (file.filename or "").lower()

    ext_ok = any(filename.endswith(ext) for ext in EXTENSION_TO_MEDIA)
    type_ok = content_type in ALLOWED_CONTENT_TYPES
    if not type_ok and not ext_ok:
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos PDF, JPG, PNG o WEBP",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="El archivo está vacío")
    if len(data) > MAX_BYTES:
        raise HTTPException(
            status_code=400,
            detail="El archivo supera el tamaño máximo permitido (10 MB)",
        )

    ext = _detect_ext(data)
    return data, ext


def save_acta(id_asig: int, data: bytes, ext: str) -> str:
    """
    Guarda el acta y retorna la ruta relativa para BD.
    Ejemplo: asig_42/acta_20260812_162530.pdf
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"acta_{timestamp}.{ext}"
    destino = _asig_dir(id_asig) / filename
    destino.write_bytes(data)
    return f"asig_{id_asig}/{filename}"


def delete_acta(ruta_relativa: str | None) -> None:
    """Elimina el archivo si existe; ignora rutas vacías o inexistentes."""
    if not ruta_relativa:
        return
    try:
        path = absolute_path(ruta_relativa)
    except HTTPException:
        return
    if path.is_file():
        path.unlink()
