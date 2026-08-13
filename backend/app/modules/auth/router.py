"""Endpoints de autenticación."""

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import TokenResponse
from app.modules.auth.service import authenticate_user, issue_token_for_user
from app.modules.usuarios.models import UsuarioSistema

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> TokenResponse:
    usuario = authenticate_user(db, form.username, form.password)
    return issue_token_for_user(usuario)


@router.post("/renew", response_model=TokenResponse)
def renew(current_user: UsuarioSistema = Depends(get_current_user)) -> TokenResponse:
    return issue_token_for_user(current_user)
