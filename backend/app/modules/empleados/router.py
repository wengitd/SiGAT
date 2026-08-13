from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user, require_editor
from app.modules.catalogos.models_org import Departamento, SubArea
from app.modules.empleados.models import Cargo, Empleado, Planta
from app.modules.empleados.schemas import EmpleadoCreate, EmpleadoOut, EmpleadoUpdate
from app.shared.eliminacion import empleado_tiene_asociaciones

router = APIRouter(prefix="/empleado", tags=["Empleado"])


def _query_empleados(db: Session):
    return db.query(Empleado).options(
        joinedload(Empleado.cargo),
        joinedload(Empleado.planta),
        joinedload(Empleado.departamento),
    )


def enrich_empleado_out(empleado: Empleado, db: Session) -> Empleado:
    """Adjunta puede_eliminar para el schema de salida."""
    empleado.puede_eliminar = not empleado_tiene_asociaciones(db, empleado.id_emp)
    return empleado


def _obtener_o_crear_cargo(db: Session, nombre: str) -> Cargo:
    nombre = nombre.strip()
    cargo = db.query(Cargo).filter(func.lower(Cargo.nombre) == nombre.lower()).first()
    if cargo is None:
        cargo = Cargo(nombre=nombre)
        db.add(cargo)
        db.flush()
    return cargo


def _obtener_o_crear_planta(db: Session, nombre: str) -> Planta:
    nombre = nombre.strip()
    planta = (
        db.query(Planta).filter(func.lower(Planta.nombre) == nombre.lower()).first()
    )
    if planta is None:
        planta = Planta(nombre=nombre)
        db.add(planta)
        db.flush()
    return planta


def _resolver_departamento(db: Session, nom_dpto: str | None) -> int | None:
    if nom_dpto is None or not nom_dpto.strip():
        return None
    dpto = (
        db.query(Departamento).filter(Departamento.nom_dpto == nom_dpto.strip()).first()
    )
    if dpto is None:
        raise HTTPException(
            status_code=400,
            detail=f"Departamento '{nom_dpto.strip()}' no existe. Créalo primero en el catálogo de departamentos.",
        )
    return dpto.id_dpto


def _aplicar_catalogos(db: Session, emp: Empleado, datos: dict) -> None:
    if "cargo" in datos:
        emp.id_cargo = _obtener_o_crear_cargo(db, datos.pop("cargo")).id_cargo
    if "planta" in datos:
        emp.id_planta = _obtener_o_crear_planta(db, datos.pop("planta")).id_planta
    if "nom_dpto" in datos:
        emp.id_dpto = _resolver_departamento(db, datos.pop("nom_dpto"))
    for campo, valor in datos.items():
        setattr(emp, campo, valor)


@router.get("/", response_model=list[EmpleadoOut])
def listar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    "Devuelve todos los Empleados."
    empleados = (
        db.query(Empleado)
        .options(
            joinedload(Empleado.cargo),
            joinedload(Empleado.planta),
            joinedload(Empleado.departamento),
        )
        .all()
    )
    return [enrich_empleado_out(e, db) for e in empleados]


@router.get("/{id_emp}", response_model=EmpleadoOut)
def obtener(
    id_emp: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Devuelve un Empleado por id."""
    emp = _query_empleados(db).filter(Empleado.id_emp == id_emp).first()
    if emp is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return enrich_empleado_out(emp, db)


@router.post("/", response_model=EmpleadoOut, status_code=status.HTTP_201_CREATED)
def crear(payload: EmpleadoCreate, db: Session = Depends(get_db)):
    datos = payload.model_dump()
    id_cargo = _obtener_o_crear_cargo(db, datos.pop("cargo")).id_cargo
    id_planta = _obtener_o_crear_planta(db, datos.pop("planta")).id_planta
    id_dpto = datos.pop("id_dpto", None)

    if payload.id_sub is not None:
        if db.query(SubArea).filter(SubArea.id_sub == payload.id_sub).first() is None:
            raise HTTPException(status_code=400, detail="Subárea no existe")

    nuevo_emp = Empleado(
        **datos, id_cargo=id_cargo, id_planta=id_planta, id_dpto=id_dpto
    )
    db.add(nuevo_emp)
    db.commit()
    db.refresh(nuevo_emp)
    emp = _query_empleados(db).filter(Empleado.id_emp == nuevo_emp.id_emp).first()
    return enrich_empleado_out(emp, db)


@router.put("/{id_emp}", response_model=EmpleadoOut)
def actualizar(
    id_emp: int,
    payload: EmpleadoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):

    act_emp = db.query(Empleado).filter(Empleado.id_emp == id_emp).first()
    if act_emp is None:
        raise HTTPException(status_code=404, detail="No encontrado")

    if payload.id_sub is not None:
        if db.query(SubArea).filter(SubArea.id_sub == payload.id_sub).first() is None:
            raise HTTPException(status_code=400, detail="Subárea no existe")

    datos = payload.model_dump(exclude_unset=True)
    _aplicar_catalogos(db, act_emp, datos)

    if payload.id_sub is not None and payload.id_dpto is not None:
        sub = (
            db.query(SubArea)
            .filter(
                SubArea.id_sub == payload.id_sub, SubArea.id_dpto == payload.id_dpto
            )
            .first()
        )
        if sub is None:
            raise HTTPException(
                status_code=400,
                detail="La subárea no pertenece al departamento seleccionado",
            )

    db.commit()
    emp = _query_empleados(db).filter(Empleado.id_emp == id_emp).first()
    return enrich_empleado_out(emp, db)


@router.delete("/{id_emp}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    id_emp: int, db: Session = Depends(get_db), current_user=Depends(require_editor)
):
    """Hard delete si no hay asociaciones; soft delete (operatividad=False) si las hay."""
    eli_emp = db.query(Empleado).filter(Empleado.id_emp == id_emp).first()

    if eli_emp is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    if empleado_tiene_asociaciones(db, id_emp):
        eli_emp.operatividad = False
    else:
        db.delete(eli_emp)

    db.commit()
    return None
