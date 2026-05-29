# Instrucciones de refactoring — SiGAT v2

Aplica los siguientes cambios al proyecto. El objetivo es introducir tablas catálogo
con Creatable Select en el frontend, normalizar FKs que antes eran VARCHAR libres,
y agregar CHECK constraints que reflejen los valores del dominio.

---

## 1. Base de datos — reemplazar init.sql completo

Reemplaza el script SQL de inicialización con el siguiente esquema.
Los cambios respecto a la versión anterior son:

**Tablas nuevas (catálogos simples):**
- `empresa(id_org SERIAL PK, nombre VARCHAR(100) NOT NULL UNIQUE)`
- `cargo(id_cargo SERIAL PK, nombre VARCHAR(100) NOT NULL UNIQUE)`
- `planta(id_planta SERIAL PK, nombre VARCHAR(100) NOT NULL UNIQUE)`
- `tipo_equipo(id_tipoeq SERIAL PK, nombre VARCHAR(100) NOT NULL UNIQUE)`
- `sistema_operativo(id_so SERIAL PK, nombre VARCHAR(100) NOT NULL UNIQUE)`
- `tipo_periferico(id_tipoper SERIAL PK, nombre VARCHAR(100) NOT NULL UNIQUE)`
- `proveedor_licencia(id_prov SERIAL PK, nombre VARCHAR(100) NOT NULL UNIQUE)`
- `proveedor_factura(id_prov_fact SERIAL PK, nombre VARCHAR(100) NOT NULL UNIQUE)`

**Tablas nuevas (catálogos dependientes — dropdown en cascada):**
- `version_licencia(id_ver SERIAL PK, id_prov INT NOT NULL FK→proveedor_licencia, nombre VARCHAR(100), UNIQUE(id_prov, nombre))`
- `sub_area(id_sub SERIAL PK, id_dpto INT NOT NULL FK→departamento, nombre VARCHAR(100), UNIQUE(id_dpto, nombre))`

**Tablas modificadas:**

`factura`:
- `prov_fact VARCHAR` → `id_prov_fact INT NOT NULL FK→proveedor_factura`

`departamento`:
- `empresa VARCHAR` → `id_org INT NOT NULL FK→empresa`
- `zona VARCHAR` → agregar `CHECK (zona IN ('Administracion','Operaciones','Produccion'))`
- eliminar columna `subarea` (migró a tabla `sub_area`)

`empleado`:
- `cargo VARCHAR NOT NULL` → `id_cargo INT NOT NULL FK→cargo`
- `planta VARCHAR NOT NULL` → `id_planta INT NOT NULL FK→planta`
- agregar `id_sub INT NULLABLE FK→sub_area`

`informatico`:
- agregar `CHECK (rol IN ('editor','viewer'))`

`licencia`:
- `proveedor VARCHAR` → `id_prov INT NOT NULL FK→proveedor_licencia`
- `ver_licen VARCHAR` → `id_ver INT NOT NULL FK→version_licencia`

`activo_ti`:
- `modelo`, `marca`, `num_serie` → quitar NOT NULL (son nullable)

`equipo_computo`:
- `tipo_equipo VARCHAR` → `id_tipoeq INT NULLABLE FK→tipo_equipo`
- `sist_op VARCHAR` → `id_so INT NULLABLE FK→sistema_operativo`
- renombrar `disco_un` → `disco_unidad`
- agregar `CHECK (disco_tipo IN ('HDD','SSD','NVMe','eMMC'))`
- agregar `CHECK (disco_unidad IN ('MB','GB','TB'))`
- corregir `mac_ethernet` y `mac_wifi` a `VARCHAR(17)`
- todos los campos excepto `id_act` son NULLABLE

`periferico`:
- `tipo_per VARCHAR` → `id_tipoper INT NULLABLE FK→tipo_periferico`
- todos los campos excepto `id_act` son NULLABLE

`historial_estado`:
- agregar `id_emp_reg INT NULLABLE FK→informatico(id_emp)`

`asignacion`:
- eliminar columna `operatividad` (reemplazada por `fecha_dev IS NULL`)
- agregar `id_emp_reg INT NULLABLE FK→informatico(id_emp)`

`check_plantilla`:
- agregar `CHECK (estado IN ('pendiente','completado','no_aplica','en_proceso'))`

**Seeds a insertar:**
```sql
INSERT INTO tipo_estado (nombre, descr) VALUES
('disponible','Activo listo para asignar'),('en_preparacion','En proceso de gestión'),
('asignado','Entregado a empleado'),('en_mantencion','En revisión o reparación'),('de_baja','Retirado del inventario');

INSERT INTO empresa (nombre) VALUES ('Holding'),('Comercializadora'),('Paneles'),('Servicios SPA');
INSERT INTO cargo (nombre) VALUES ('Administrativo'),('Informático'),('Analista'),('Jefatura'),('Técnico');
INSERT INTO planta (nombre) VALUES ('Batuco'),('Paneles');
INSERT INTO tipo_equipo (nombre) VALUES ('Notebook'),('Tablet'),('Gabinete Slim'),('Gabinete'),('NUC');
INSERT INTO sistema_operativo (nombre) VALUES ('Windows 11 64 bits'),('Windows 10 64 bits');
INSERT INTO tipo_periferico (nombre) VALUES ('Monitor'),('Impresora');
INSERT INTO proveedor_licencia (nombre) VALUES ('Office'),('Windows'),('Sophos');
INSERT INTO version_licencia (id_prov, nombre) VALUES
(1,'2019'),(1,'365'),(2,'Enterprise'),(2,'Server'),(2,'Home'),(3,'Intercept X');
```

---

## 2. Modelos SQLAlchemy

Convenciones del proyecto: `Mapped[tipo]` implica NOT NULL, `Mapped[tipo | None]` implica nullable.
PK compartida en herencia 1:1: solo el campo `id_act` (o `id_emp`) lleva `primary_key=True` en las tablas hijas.

**Crear modelos para todos los catálogos nuevos:**

```python
class Empresa(Base):
    __tablename__ = "empresa"
    id_org  : Mapped[int] = mapped_column(primary_key=True)
    nombre  : Mapped[str] = mapped_column(String(100))
    departamentos = relationship("Departamento", back_populates="empresa")

class Cargo(Base):
    __tablename__ = "cargo"
    id_cargo : Mapped[int] = mapped_column(primary_key=True)
    nombre   : Mapped[str] = mapped_column(String(100))
    empleados = relationship("Empleado", back_populates="cargo")

class Planta(Base):
    __tablename__ = "planta"
    id_planta : Mapped[int] = mapped_column(primary_key=True)
    nombre    : Mapped[str] = mapped_column(String(100))
    empleados = relationship("Empleado", back_populates="planta")

class TipoEquipo(Base):
    __tablename__ = "tipo_equipo"
    id_tipoeq : Mapped[int] = mapped_column(primary_key=True)
    nombre    : Mapped[str] = mapped_column(String(100))
    equipos   = relationship("EquipoComputo", back_populates="tipo_equipo")

class SistemaOperativo(Base):
    __tablename__ = "sistema_operativo"
    id_so  : Mapped[int] = mapped_column(primary_key=True)
    nombre : Mapped[str] = mapped_column(String(100))
    equipos = relationship("EquipoComputo", back_populates="sistema_operativo")

class TipoPeriferico(Base):
    __tablename__ = "tipo_periferico"
    id_tipoper  : Mapped[int] = mapped_column(primary_key=True)
    nombre      : Mapped[str] = mapped_column(String(100))
    perifericos = relationship("Periferico", back_populates="tipo_periferico")

class ProveedorLicencia(Base):
    __tablename__ = "proveedor_licencia"
    id_prov   : Mapped[int] = mapped_column(primary_key=True)
    nombre    : Mapped[str] = mapped_column(String(100))
    versiones = relationship("VersionLicencia", back_populates="proveedor")

class ProveedorFactura(Base):
    __tablename__ = "proveedor_factura"
    id_prov_fact : Mapped[int] = mapped_column(primary_key=True)
    nombre       : Mapped[str] = mapped_column(String(100))
    facturas     = relationship("Factura", back_populates="proveedor")

class VersionLicencia(Base):
    __tablename__ = "version_licencia"
    id_ver  : Mapped[int] = mapped_column(primary_key=True)
    id_prov : Mapped[int] = mapped_column(ForeignKey("proveedor_licencia.id_prov"))
    nombre  : Mapped[str] = mapped_column(String(100))
    proveedor  = relationship("ProveedorLicencia", back_populates="versiones")
    licencias  = relationship("Licencia", back_populates="version")

class SubArea(Base):
    __tablename__ = "sub_area"
    id_sub  : Mapped[int] = mapped_column(primary_key=True)
    id_dpto : Mapped[int] = mapped_column(ForeignKey("departamento.id_dpto"))
    nombre  : Mapped[str] = mapped_column(String(100))
    departamento = relationship("Departamento", back_populates="subareas")
    empleados    = relationship("Empleado", back_populates="subarea")
```

**Modificar modelos existentes:**

`Factura`: `prov_fact: Mapped[str]` → `id_prov_fact: Mapped[int] = mapped_column(ForeignKey("proveedor_factura.id_prov_fact"))` + `proveedor = relationship("ProveedorFactura")`

`Departamento`:
- `empresa: Mapped[str]` → `id_org: Mapped[int] = mapped_column(ForeignKey("empresa.id_org"))`
- eliminar campo `subarea`
- agregar `empresa = relationship("Empresa", back_populates="departamentos")`
- agregar `subareas = relationship("SubArea", back_populates="departamento")`

`Empleado`:
- `cargo: Mapped[str]` → `id_cargo: Mapped[int] = mapped_column(ForeignKey("cargo.id_cargo"))`
- `planta: Mapped[str]` → `id_planta: Mapped[int] = mapped_column(ForeignKey("planta.id_planta"))`
- agregar `id_sub: Mapped[int | None] = mapped_column(ForeignKey("sub_area.id_sub"))`
- agregar relationships: `cargo`, `planta`, `subarea`

`Licencia`:
- `proveedor: Mapped[str]` → `id_prov: Mapped[int] = mapped_column(ForeignKey("proveedor_licencia.id_prov"))`
- `ver_licen: Mapped[str]` → `id_ver: Mapped[int] = mapped_column(ForeignKey("version_licencia.id_ver"))`

`ActivoTi`:
- `modelo`, `marca`, `num_serie` → `Mapped[str | None]`

`EquipoComputo`:
- SOLO `id_act` lleva `primary_key=True` — `id_tipoeq` e `id_so` son FK normales, no PK
- `tipo_equipo: Mapped[str]` → `id_tipoeq: Mapped[int | None] = mapped_column(ForeignKey("tipo_equipo.id_tipoeq"))`
- `sist_op: Mapped[str]` → `id_so: Mapped[int | None] = mapped_column(ForeignKey("sistema_operativo.id_so"))`
- renombrar `disco_un` → `disco_unidad`
- todos los campos (excepto `id_act`) deben ser `Mapped[tipo | None]`
- agregar relationships: `tipo_equipo`, `sistema_operativo`

`Periferico`:
- SOLO `id_act` lleva `primary_key=True` — `id_tipoper` es FK normal, no PK
- `tipo_per: Mapped[str]` → `id_tipoper: Mapped[int | None] = mapped_column(ForeignKey("tipo_periferico.id_tipoper"))`
- `valor_tec` y `u_medida` → `Mapped[Decimal | None]` y `Mapped[str | None]`
- agregar `tipo_periferico = relationship("TipoPeriferico")`

`HistorialEstado`:
- agregar `id_emp_reg: Mapped[int | None] = mapped_column(ForeignKey("informatico.id_emp"))`

`Asignacion`:
- eliminar campo `operatividad`
- agregar `id_emp_reg: Mapped[int | None] = mapped_column(ForeignKey("informatico.id_emp"))`

`Checklist`:
- `fecha_ini`, `fecha_ter`, `id_emp` → `Mapped[date | None]` y `Mapped[int | None]`

---

## 3. Schemas Pydantic

**Crear schemas para todos los catálogos nuevos.**
Todos siguen el mismo patrón (ejemplo con `Empresa`, replicar para los demás):

```python
class EmpresaBase(BaseModel):
    nombre : str = Field(max_length=100)

class EmpresaCreate(EmpresaBase):
    pass

class EmpresaUpdate(BaseModel):
    nombre : str | None = Field(default=None, max_length=100)

class EmpresaOut(EmpresaBase):
    id_org : int
    model_config = ConfigDict(from_attributes=True)
```

Catálogos a crear con este patrón:
`Empresa(id_org)`, `Cargo(id_cargo)`, `Planta(id_planta)`, `TipoEquipo(id_tipoeq)`,
`SistemaOperativo(id_so)`, `TipoPeriferico(id_tipoper)`,
`ProveedorLicencia(id_prov)`, `ProveedorFactura(id_prov_fact)`

Catálogos dependientes (agregar FK del padre en Base):
```python
class VersionLicenciaBase(BaseModel):
    nombre  : str = Field(max_length=100)
    id_prov : int  # FK obligatorio

class SubAreaBase(BaseModel):
    nombre  : str = Field(max_length=100)
    id_dpto : int  # FK obligatorio
```

**Modificar schemas existentes:**

`ActivoSchema` (equipo_computo):
- `sist_op: str` → `id_so: int | None`
- `tipo_equipo: str` → `id_tipoeq: int | None`
- `disco_un` → `disco_unidad`
- agregar Literal: `disco_tipo: Literal["HDD","SSD","NVMe","eMMC"] | None`
- agregar Literal: `disco_unidad: Literal["MB","GB","TB"] | None`

`ActivoSchema` (periferico):
- `tipo_per: str` → `id_tipoper: int | None`

`LicenciaSchema`:
- `proveedor: str` → `id_prov: int`
- `ver_licen: str` → `id_ver: int`

`EmpleadoSchema`:
- `cargo: str` → `id_cargo: int`
- `planta: str` → `id_planta: int`
- agregar `id_sub: int | None = None`

`AsignacionSchema`:
- eliminar `operatividad`
- `id_emp_reg: int | None = None` (ya nullable)

`HistorialEstadoSchema`:
- agregar `id_emp_reg: int | None = None`

`InformaticoSchema`:
- `rol: str` → `rol: Literal["editor","viewer"]`

---

## Reglas generales del proyecto

- Tablas snake_case minúsculas
- PKs como `id_<abreviatura>`
- FKs con mismo nombre que la PK referenciada
- `Mapped[tipo]` = NOT NULL, `Mapped[tipo | None]` = nullable
- En herencia 1:1, solo la columna que comparte PK con el padre lleva `primary_key=True`
- Soft delete: `vigente` en `informatico`, `operatividad` en `empleado` y `tipo_estado`, `disponibilidad` en `activo_ti`
- Hash de passwords: Argon2 vía passlib (no bcrypt)
- Backend: FastAPI + SQLAlchemy 2.0 + Pydantic v2
