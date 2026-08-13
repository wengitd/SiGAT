from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.modules.auth.dependencies import get_current_user, require_admin
from app.modules.usuarios.models import UsuarioSistema
from app.modules.usuarios.schemas import (
    UsuarioSistemaCreate,
    UsuarioSistemaOut,
    UsuarioSistemaUpdate,
)
from app.shared.eliminacion import usuario_tiene_asociaciones

router = APIRouter(prefix="/usuario_sistema", tags=["Usuarios del sistema"])


def enrich_usuario_out(usuario: UsuarioSistema, db: Session) -> UsuarioSistema:
    """Adjunta puede_eliminar para el schema de salida."""
    usuario.puede_eliminar = not usuario_tiene_asociaciones(db, usuario.id_usuario)
    return usuario


@router.get("/", response_model=list[UsuarioSistemaOut])
def listar(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Muestra todos los usuarios del sistema."""
    usuarios = db.query(UsuarioSistema).all()
    return [enrich_usuario_out(u, db) for u in usuarios]


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
    return enrich_usuario_out(usuario, db)


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

    hash_pass = hash_password(payload.password)

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
    return enrich_usuario_out(nuevo_usuario, db)


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
        datos["hash_pass"] = hash_password(datos.pop("password"))

    for campo, valor in datos.items():
        setattr(usuario, campo, valor)

    db.commit()
    db.refresh(usuario)
    return enrich_usuario_out(usuario, db)


@router.delete("/{id_usuario}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_usuario: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Hard delete si no hay asociaciones; soft delete (vigente=False) si las hay."""
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

    if usuario_tiene_asociaciones(db, id_usuario):
        usuario.vigente = False
    else:
        db.delete(usuario)

    db.commit()
    return None
