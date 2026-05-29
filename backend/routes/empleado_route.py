from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from auth.dependencies import get_current_user, require_editor

from database import get_db
from models.empleado_model import Empleado, Cargo, Planta
from schemas.empleado_schema import EmpleadoCreate, EmpleadoUpdate, EmpleadoOut
from models.dpto_model import Departamento

router = APIRouter(prefix="/empleado", tags=["Empleado"])


def _query_empleados(db: Session):
    return db.query(Empleado).options(
        joinedload(Empleado.cargo),
        joinedload(Empleado.planta),
        joinedload(Empleado.departamento),
    )


def _empleado_a_out(emp: Empleado) -> EmpleadoOut:
    return EmpleadoOut(
        id_emp=emp.id_emp,
        rut=emp.rut,
        nombre=emp.nombre,
        email=emp.email,
        operatividad=emp.operatividad,
        cargo=emp.cargo.nombre,
        planta=emp.planta.nombre,
        nom_dpto=emp.departamento.nom_dpto if emp.departamento else None,
    )


def _obtener_o_crear_cargo(db: Session, nombre: str) -> Cargo:
    nombre = nombre.strip()
    cargo = db.query(Cargo).filter(Cargo.nombre == nombre).first()
    if cargo is None:
        cargo = Cargo(nombre=nombre)
        db.add(cargo)
        db.flush()
    return cargo


def _obtener_o_crear_planta(db: Session, nombre: str) -> Planta:
    nombre = nombre.strip()
    planta = db.query(Planta).filter(Planta.nombre == nombre).first()
    if planta is None:
        planta = Planta(nombre=nombre)
        db.add(planta)
        db.flush()
    return planta


def _resolver_departamento(db: Session, nom_dpto: str | None) -> int | None:
    if nom_dpto is None or not nom_dpto.strip():
        return None
    dpto = db.query(Departamento).filter(Departamento.nom_dpto == nom_dpto.strip()).first()
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
    return [_empleado_a_out(e) for e in _query_empleados(db).all()]


@router.get("/{id_emp}", response_model=EmpleadoOut)
def obtener(id_emp: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve un Empleado por id."""
    emp = _query_empleados(db).filter(Empleado.id_emp == id_emp).first()
    if emp is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return _empleado_a_out(emp)


@router.post("/", response_model=EmpleadoOut, status_code=status.HTTP_201_CREATED)
def crear(payload: EmpleadoCreate, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    datos = payload.model_dump()
    id_cargo = _obtener_o_crear_cargo(db, datos.pop("cargo")).id_cargo
    id_planta = _obtener_o_crear_planta(db, datos.pop("planta")).id_planta
    id_dpto = _resolver_departamento(db, datos.pop("nom_dpto"))

    nuevo_emp = Empleado(**datos, id_cargo=id_cargo, id_planta=id_planta, id_dpto=id_dpto)
    db.add(nuevo_emp)
    db.commit()
    db.refresh(nuevo_emp)
    emp = _query_empleados(db).filter(Empleado.id_emp == nuevo_emp.id_emp).first()
    return _empleado_a_out(emp)


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

    datos = payload.model_dump(exclude_unset=True)
    _aplicar_catalogos(db, act_emp, datos)

    db.commit()
    emp = _query_empleados(db).filter(Empleado.id_emp == id_emp).first()
    return _empleado_a_out(emp)


@router.delete("/{id_emp}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_emp: int, db: Session = Depends(get_db), current_user=Depends(require_editor)):
    eli_emp = db.query(Empleado).filter(Empleado.id_emp == id_emp).first()

    if eli_emp is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    eli_emp.operatividad = False
    db.commit()

    return None
