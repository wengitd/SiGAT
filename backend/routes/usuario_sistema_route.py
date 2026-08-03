from auth.dependencies import get_current_user, require_admin
from fastapi import APIRouter, Depends, HTTPException, status
from models.usuario_sistema_model import UsuarioSistema
from passlib.context import CryptContext
from schemas.usuario_sistema_schema import (
    UsuarioSistemaCreate,
    UsuarioSistemaOut,
    UsuarioSistemaUpdate,
)
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db

router = APIRouter(prefix="/usuario_sistema", tags=["Usuarios del sistema"])

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


@router.get("/", response_model=list[UsuarioSistemaOut])
def listar(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Muestra todos los usuarios del sistema."""
    return db.query(UsuarioSistema).all()


@router.get("/{id_usuario}", response_model=UsuarioSistemaOut)
def obtener(
    id_usuario: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Devuelve un usuario del sistema por id."""
    usuario = (
        db.query(UsuarioSistema)
        .filter(UsuarioSistema.id_usuario == id_usuario)
        .first()
    )
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.post(
    "/", response_model=UsuarioSistemaOut, status_code=status.HTTP_201_CREATED
)
def crear(
    payload: UsuarioSistemaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Crea un nuevo usuario del sistema (solo administradores)."""
    # Verificar si ya existe un usuario con el mismo email
    existente = (
        db.query(UsuarioSistema)
        .filter(func.lower(UsuarioSistema.email) == payload.email.lower())
        .first()
    )
    if existente is not None:
        raise HTTPException(
            status_code=400, detail="Ya existe un usuario con este correo electrónico"
        )

    hash_pass = pwd_context.hash(payload.password)

    nuevo_usuario = UsuarioSistema(
        nombre=payload.nombre,
        email=payload.email.lower(),
        hash_pass=hash_pass,
        rol=payload.rol,
        vigente=payload.vigente,
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


@router.put("/{id_usuario}", response_model=UsuarioSistemaOut)
def actualizar(
    id_usuario: int,
    payload: UsuarioSistemaUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Actualiza un usuario del sistema (solo administradores)."""
    usuario = (
        db.query(UsuarioSistema)
        .filter(UsuarioSistema.id_usuario == id_usuario)
        .first()
    )
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    datos = payload.model_dump(exclude_unset=True)

    if datos.get("vigente") is False and id_usuario == current_user.id_usuario:
        raise HTTPException(
            status_code=400, detail="No puedes desactivar tu propio usuario"
        )

    if "email" in datos and datos["email"]:
        email_nuevo = datos["email"].lower()
        existente = (
            db.query(UsuarioSistema)
            .filter(
                func.lower(UsuarioSistema.email) == email_nuevo,
                UsuarioSistema.id_usuario != id_usuario,
            )
            .first()
        )
        if existente:
            raise HTTPException(
                status_code=400, detail="El correo electrónico ya está en uso"
            )
        datos["email"] = email_nuevo

    if "password" in datos and datos["password"]:
        datos["hash_pass"] = pwd_context.hash(datos.pop("password"))

    for campo, valor in datos.items():
        setattr(usuario, campo, valor)

    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{id_usuario}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_usuario: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Desactiva un usuario del sistema (solo administradores)."""
    if id_usuario == current_user.id_usuario:
        raise HTTPException(
            status_code=400, detail="No puedes desactivar tu propio usuario"
        )

    usuario = (
        db.query(UsuarioSistema)
        .filter(UsuarioSistema.id_usuario == id_usuario)
        .first()
    )
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.vigente = False
    db.commit()
    return None
