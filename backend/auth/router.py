from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext #para validar la pass
from auth.jwt import create_access_token

from database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models.empleado_model import Empleado, Informatico

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    
    email_emp=db.query(Empleado).filter(Empleado.email == form.username).first()
    
    if email_emp:
        emp_inf=db.query(Informatico).filter(Informatico.id_emp == email_emp.id_emp).first()
        #validado que el email corresponde a email informatioc
        if emp_inf:
            if not pwd_context.verify(form.password, emp_inf.hash_pass):
                raise HTTPException(status_code=401, detail="Contraseña incorrecta")
            token = create_access_token({"sub": str(emp_inf.id_emp), "rol": emp_inf.rol})
            return {"access_token": token, "token_type": "bearer"}
        else: 
            #Email no corresponde a un Informatico
            raise  HTTPException(status_code=404, detail="")
    else:
        #Email no encontrado
        raise  HTTPException(status_code=404, detail="Ingresar datos que correspondan")


