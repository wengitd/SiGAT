# Diccionario de Datos — SiGAT

**Sistema de Gestión de Activos Tecnológicos para Forestal Leonera**

Documento que detalla el esquema lógico y físico de la base de datos del sistema SiGAT, incluyendo entidades, atributos, restricciones de integridad y relaciones. Corresponde al Anexo D del informe de proyecto de título y se complementa con el modelo entidad-relación (ER) y el modelo relacional (MER) presentados en el Capítulo 5.

Motor de base de datos: **PostgreSQL 16**.

---

## 1. Introducción

Un diccionario de datos es un repositorio centralizado que describe los elementos de una base de datos: tablas, columnas, tipos de datos, restricciones y relaciones entre entidades. Su propósito es servir como referencia formal para desarrolladores, mantenedores y auditores del sistema, garantizando la consistencia semántica de los datos a lo largo del ciclo de vida del software [1] [2].

La estructura de este diccionario sigue las recomendaciones de la norma ISO/IEC/IEEE 29148:2018 sobre especificaciones de software [1] y la práctica habitual en sistemas de información empresariales. Para cada entidad se documenta su propósito de negocio, sus atributos con tipo y restricciones, y las claves foráneas que la vinculan con el resto del modelo.

---

## 2. Convenciones de nomenclatura

| Elemento | Convención | Ejemplo |
| --- | --- | --- |
| Nombres de tablas | minúsculas, snake_case, en singular o plural según uso | `empleado`, `historial_estado` |
| Claves primarias | `id_<abreviatura_de_entidad>` | `id_emp`, `id_dpto`, `id_tipoe` |
| Claves foráneas | igual nombre que la PK referenciada | `empleado.id_dpto` ↔ `departamento.id_dpto` |
| Columnas | minúsculas, snake_case, sin acentos ni caracteres especiales | `fecha_reg`, `num_serie` |
| Discriminadores de subtipo | `tipo`, validado por restricción CHECK | `activo_ti.tipo IN ('equipo_computo','periferico')` |
| Tablas de catálogo | sustantivo singular que nombra el concepto catalogado | `marca`, `cargo`, `proveedor_licencia` |

Estas convenciones se basan en buenas prácticas de modelado relacional descritas por Date [3] y Elmasri y Navathe [4], adaptadas al contexto académico del proyecto.

---

## 3. Tipos de datos utilizados

| Tipo PostgreSQL | Uso en el sistema |
| --- | --- |
| `SERIAL` | Claves primarias auto-incrementales (genera secuencia + INTEGER NOT NULL) |
| `INTEGER` (`INT`) | Claves foráneas y atributos enteros |
| `VARCHAR(n)` | Texto corto con longitud máxima conocida |
| `TEXT` | Texto sin límite de longitud (descripciones, observaciones) |
| `DATE` | Fechas sin componente horario |
| `TIMESTAMP` | Fechas con hora (registro de eventos) |
| `BOOLEAN` | Valores lógicos verdadero/falso |
| `DECIMAL` | Valores numéricos con decimales (ej. medidas técnicas) |

---

## 4. Tablas del esquema

A continuación se documenta cada tabla del esquema en el orden lógico de creación, respetando las dependencias entre claves foráneas. El orden expuesto refleja la secuencia del script `init.sql`.

El esquema distingue dos familias de tablas de catálogo:

- **Catálogos simples**: listas de valores independientes, sin dependencia de otro catálogo (`empresa`, `cargo`, `planta`, `tipo_equipo`, `familia_so`, `tipo_periferico`, `marca`, `proveedor_licencia`, `proveedor_factura`, `disponibilidad`).
- **Catálogos dependientes**: sus opciones sólo tienen sentido en el contexto de un catálogo padre y se cargan en el frontend mediante listas desplegables en cascada (`version_so` depende de `familia_so`; `edicion_so` depende de `version_so`; `modelo` depende de `marca`; `version_licencia` depende de `proveedor_licencia`; `sub_area` depende de `departamento`).

En ambos casos, el frontend implementa el patrón **"Creatable Select"**: el usuario elige una opción existente del catálogo o crea una nueva sin salir del formulario, lo que mantiene los catálogos vivos sin requerir mantenimiento manual previo.

---

### 4.1 `empresa`

**Descripción**: catálogo simple con las empresas subsidiarias del Holding Leonera. Es el catálogo padre de `departamento`.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_org` | SERIAL | PK | auto | Identificador único de la empresa |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE | — | Nombre de la empresa subsidiaria |

**Claves foráneas**: ninguna.

**Datos semilla cargados**: `Holding`, `Comercializadora`, `Paneles`, `Servicios SPA`.

---

### 4.2 `cargo`

**Descripción**: catálogo simple con los cargos que puede desempeñar un empleado dentro de la organización.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_cargo` | SERIAL | PK | auto | Identificador único del cargo |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE | — | Nombre del cargo |

**Claves foráneas**: ninguna.

**Datos semilla cargados**: `Administrativo`, `Informatico`, `Analista`, `Jefatura`, `Tecnico`.

---

### 4.3 `planta`

**Descripción**: catálogo simple con las plantas o instalaciones físicas del holding donde trabajan los empleados.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_planta` | SERIAL | PK | auto | Identificador único de la planta |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE | — | Nombre de la planta o instalación |

**Claves foráneas**: ninguna.

**Datos semilla cargados**: `Batuco`, `Paneles`.

---

### 4.4 `tipo_equipo`

**Descripción**: catálogo simple con los subtipos de equipo de cómputo reconocidos por el sistema.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_tipoeq` | SERIAL | PK | auto | Identificador único del tipo de equipo |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE | — | Nombre del tipo de equipo (`Notebook`, `Tablet`, `NUC`, etc.) |

**Claves foráneas**: ninguna.

**Datos semilla cargados**: `Notebook`, `Tablet`, `Gabinete Slim`, `Gabinete`, `NUC`.

---

### 4.5 `familia_so`

**Descripción**: catálogo simple con las familias de sistema operativo. Es el catálogo raíz de la cadena en cascada `familia_so → version_so → edicion_so` utilizada para especificar el sistema operativo instalado en un equipo de cómputo.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_fam_so` | SERIAL | PK | auto | Identificador único de la familia de sistema operativo |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE | — | Nombre de la familia (`Windows`, `Linux`, `MacOS`) |

**Claves foráneas**: ninguna.

---

### 4.6 `version_so`

**Descripción**: catálogo dependiente de `familia_so`. Representa la versión del sistema operativo dentro de una familia (ej. `11` o `10` para Windows, `Ubuntu` para Linux).

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_ver_so` | SERIAL | PK | auto | Identificador único de la versión de sistema operativo |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE (`id_ver_so`, `nombre`) | — | Nombre de la versión |
| `id_fam_so` | INT | FK, NOT NULL | — | Familia de sistema operativo a la que pertenece |

**Claves foráneas**:
- `version_so.id_fam_so → familia_so.id_fam_so` (`ON DELETE CASCADE`)

---

### 4.7 `edicion_so`

**Descripción**: catálogo dependiente de `version_so`. Representa la edición específica del sistema operativo (ej. `Pro x64`, `Home`, `LTS`). Es el nivel más específico de la cadena de catálogos de sistema operativo y el que finalmente se referencia desde `equipo_computo`.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_edicion_so` | SERIAL | PK | auto | Identificador único de la edición de sistema operativo |
| `nombre` | VARCHAR(100) | NOT NULL | — | Nombre de la edición |
| `id_ver_so` | INT | FK, NOT NULL | — | Versión de sistema operativo a la que pertenece |

**Claves foráneas**:
- `edicion_so.id_ver_so → version_so.id_ver_so` (`ON DELETE CASCADE`)

---

### 4.8 `tipo_periferico`

**Descripción**: catálogo simple con los tipos de periféricos reconocidos por el sistema.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_tipoper` | SERIAL | PK | auto | Identificador único del tipo de periférico |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE | — | Nombre del tipo de periférico (`Monitor`, `Impresora`, etc.) |

**Claves foráneas**: ninguna.

**Datos semilla cargados**: `Monitor`, `Impresora`.

---

### 4.9 `marca`

**Descripción**: catálogo simple con las marcas de fabricantes de activos tecnológicos. Es el catálogo padre de `modelo`. El valor efectivo de marca de un activo se almacena de forma denormalizada como texto libre en `activo_ti.marca`; este catálogo alimenta las sugerencias del "Creatable Select" del frontend.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_marca` | SERIAL | PK | auto | Identificador único de la marca |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE | — | Nombre de la marca del fabricante |

**Claves foráneas**: ninguna.

---

### 4.10 `modelo`

**Descripción**: catálogo dependiente de `marca`, con los modelos conocidos por marca. Al igual que `marca`, alimenta las sugerencias del frontend; el valor efectivo del activo se almacena como texto libre en `activo_ti.modelo`.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_modelo` | SERIAL | PK | auto | Identificador único del modelo |
| `id_marca` | INT | FK, NOT NULL | — | Marca a la que pertenece el modelo |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE (`id_marca`, `nombre`) | — | Nombre del modelo |

**Claves foráneas**:
- `modelo.id_marca → marca.id_marca` (`ON DELETE CASCADE`)

---

### 4.11 `proveedor_licencia`

**Descripción**: catálogo simple con los proveedores de software licenciado. Es el catálogo padre de `version_licencia`.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_prov` | SERIAL | PK | auto | Identificador único del proveedor de licencia |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE | — | Nombre del proveedor (`Office`, `Windows`, `Sophos`, etc.) |

**Claves foráneas**: ninguna.

**Datos semilla cargados**: `Office`, `Windows`, `Sophos`.

---

### 4.12 `proveedor_factura`

**Descripción**: catálogo simple con los proveedores que emiten facturas de adquisición de activos tecnológicos.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_prov_fact` | SERIAL | PK | auto | Identificador único del proveedor de factura |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE | — | Nombre del proveedor |

**Claves foráneas**: ninguna.

---

### 4.13 `disponibilidad`

**Descripción**: catálogo simple con los estados operativos que puede tener un activo tecnológico frente al usuario (ej. disponible, asignado, en mantención, de baja), inspirados en el ciclo de vida de activos de TI del marco ITIL 4 [6]. Cada valor incluye un color asociado, usado por el frontend para representar el estado con una etiqueta (badge) visual. Junto con `estado_dispo`, define qué disponibilidades son válidas para cada condición física del activo (`tipo_estado`).

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_dispo` | SERIAL | PK | auto | Identificador único de la disponibilidad |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE | — | Nombre del estado de disponibilidad |
| `descr` | VARCHAR(100) | NOT NULL | — | Descripción del estado de disponibilidad |
| `color` | VARCHAR(20) | — | — | Color de la etiqueta en el frontend (token MUI: `success`, `warning`, `error`, `info`, `primary`, `default`) |

**Claves foráneas**: ninguna.

---

### 4.14 `version_licencia`

**Descripción**: catálogo dependiente de `proveedor_licencia`, con las versiones de software disponibles para cada proveedor (ej. `Office` → `2019`, `365`; `Windows` → `Enterprise`, `Server`).

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_ver` | SERIAL | PK | auto | Identificador único de la versión de licencia |
| `id_prov` | INT | FK, NOT NULL | — | Proveedor de licencia al que pertenece la versión |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE (`id_prov`, `nombre`) | — | Nombre de la versión |

**Claves foráneas**:
- `version_licencia.id_prov → proveedor_licencia.id_prov` (`ON DELETE CASCADE`)

**Datos semilla cargados**: `Office` → `2019`, `365`; `Windows` → `Enterprise`, `Server`, `Home`; `Sophos` → `Intercept X`.

---

### 4.15 `factura`

**Descripción**: registra las facturas asociadas a la adquisición de activos tecnológicos por parte de la empresa. Solo aplica para activos con origen `'empresa'`; los activos personales (origen `'personal'`) no tienen factura asociada.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_fact` | SERIAL | PK | auto | Identificador único de la factura |
| `fecha_em` | DATE | — | — | Fecha de emisión de la factura |
| `num_folio` | INT | NOT NULL, UNIQUE | — | Número de folio de la factura |
| `ruta_pdf_fact` | VARCHAR(200) | NOT NULL | — | Ruta del archivo PDF de la factura en el almacenamiento |
| `id_prov_fact` | INT | FK, NOT NULL | — | Proveedor que emitió la factura |

**Claves foráneas**:
- `factura.id_prov_fact → proveedor_factura.id_prov_fact`

---

### 4.16 `departamento`

**Descripción**: representa las unidades organizacionales del Holding Leonera a las que pertenecen los empleados. Cada departamento se asocia a una empresa subsidiaria del catálogo `empresa` y a una zona geográfica/funcional restringida por CHECK.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_dpto` | SERIAL | PK | auto | Identificador único del departamento |
| `zona` | VARCHAR(50) | CHECK | — | Zona donde opera el departamento. Valores: `'Administracion'`, `'Operaciones'`, `'Produccion'` |
| `nom_dpto` | VARCHAR(100) | — | — | Nombre del departamento |
| `id_org` | INT | FK, NOT NULL | — | Empresa subsidiaria a la que pertenece el departamento |

**Claves foráneas**:
- `departamento.id_org → empresa.id_org`

**Datos semilla cargados**: `Contabilidad` y `Tesorería` (Holding, Administración), `TD` (Comercializadora, Administración), `Mantención` (Comercializadora, Operaciones).

---

### 4.17 `sub_area`

**Descripción**: catálogo dependiente de `departamento`, con las subáreas funcionales dentro de cada departamento (ej. `TD` → `Soporte`, `Desarrollo`, `BI`).

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_sub` | SERIAL | PK | auto | Identificador único de la subárea |
| `id_dpto` | INT | FK, NOT NULL | — | Departamento al que pertenece la subárea |
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE (`id_dpto`, `nombre`) | — | Nombre de la subárea |

**Claves foráneas**:
- `sub_area.id_dpto → departamento.id_dpto` (`ON DELETE CASCADE`)

---

### 4.18 `empleado`

**Descripción**: registra a las personas que trabajan en alguna de las empresas del holding. Un empleado puede recibir activos tecnológicos en asignación. Cargo, planta, departamento y subárea se referencian mediante FK a sus respectivos catálogos en lugar de texto libre. La columna `operatividad` permite el soft-delete cuando un empleado deja la organización, preservando el historial sin borrado físico.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_emp` | SERIAL | PK | auto | Identificador único del empleado |
| `rut` | VARCHAR(50) | NOT NULL, UNIQUE | — | Rol único tributario del empleado |
| `nombre` | VARCHAR(50) | NOT NULL | — | Nombre completo del empleado |
| `email` | VARCHAR(50) | NOT NULL, UNIQUE | — | Correo corporativo del empleado |
| `operatividad` | BOOLEAN | NOT NULL | TRUE | Indica si el empleado se encuentra vigente en la empresa |
| `id_cargo` | INT | FK, NOT NULL | — | Cargo del empleado |
| `id_planta` | INT | FK, NOT NULL | — | Planta o instalación física donde trabaja |
| `id_dpto` | INT | FK | — | Departamento al que pertenece |
| `id_sub` | INT | FK | — | Subárea a la que pertenece (opcional: no todos los empleados tienen subárea) |

**Claves foráneas**:
- `empleado.id_cargo → cargo.id_cargo`
- `empleado.id_planta → planta.id_planta`
- `empleado.id_dpto → departamento.id_dpto`
- `empleado.id_sub → sub_area.id_sub`

---

### 4.19 `usuario_sistema`

**Descripción**: subtipo de `empleado` que representa al personal del área de Soporte e Infraestructura del Departamento de Transformación Digital. Un usuario del sistema puede autenticarse y ejecutar acciones operativas (asignar activos, ejecutar checklists, registrar cambios de estado). Implementa la herencia 1:1 sobre `empleado` mediante PK compartida.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_emp` | INT | PK, FK | — | Identificador del empleado (compartido con `empleado.id_emp`) |
| `hash_pass` | VARCHAR(255) | NOT NULL | — | Hash de la contraseña generado con argon2id (irreversible) |
| `rol` | VARCHAR(20) | NOT NULL, CHECK | — | Rol funcional. Valores permitidos: `'editor'`, `'auditor'`, `'admin'` |
| `vigente` | BOOLEAN | NOT NULL | TRUE | Indica si el usuario está dentro de la empresa y tiene permiso para acceder al sistema, sin perder la trazabilidad de los checklists que realizó |

**Claves foráneas**:
- `usuario_sistema.id_emp → empleado.id_emp`

**Notas de implementación**:
El hash de contraseña se genera con el algoritmo argon2id mediante la librería argon2-cffi a través de passlib. Argon2 fue el algoritmo ganador de la Password Hashing Competition de 2015, conforme a las recomendaciones de OWASP para almacenamiento seguro de credenciales [5], y reemplaza al algoritmo bcrypt anterior por su mayor resistencia a ataques con hardware especializado.

---

### 4.20 `checklist`

**Descripción**: representa una ejecución concreta de una checklist de preparación técnica de un activo, realizada por un usuario del sistema. Cada checklist se compone de varios ítems mediante la tabla `check_plantilla`.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_check` | SERIAL | PK | auto | Identificador único de la ejecución |
| `nombre` | VARCHAR(50) | NOT NULL | — | Nombre descriptivo de la ejecución |
| `fecha_ini` | DATE | — | — | Fecha de inicio del checklist |
| `fecha_ter` | DATE | — | — | Fecha de finalización del checklist |
| `id_emp` | INT | FK | — | Usuario del sistema que ejecuta el checklist |

**Claves foráneas**:
- `checklist.id_emp → usuario_sistema.id_emp`

---

### 4.21 `plantilla`

**Descripción**: catálogo de ítems reutilizables que pueden formar parte de un checklist de preparación. Por ejemplo: "Instalar sistema operativo", "Configurar red corporativa", "Instalar antivirus".

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_ip` | SERIAL | PK | auto | Identificador único del ítem de plantilla |
| `descr` | TEXT | — | — | Descripción del ítem |
| `orden` | INT | NOT NULL | — | Orden de ejecución sugerido |

**Claves foráneas**: ninguna.

---

### 4.22 `check_plantilla`

**Descripción**: tabla asociativa que materializa la relación N:N entre `checklist` y `plantilla`. Para cada ítem incluido en un checklist, registra el estado de cumplimiento y observaciones específicas de esa ejecución.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_check` | INT | PK compuesta, FK, NOT NULL | — | Checklist del que forma parte |
| `id_ip` | INT | PK compuesta, FK, NOT NULL | — | Ítem de plantilla incluido |
| `estado` | VARCHAR(50) | NOT NULL, CHECK | — | Estado del ítem en esta ejecución. Valores: `'pendiente'`, `'completado'`, `'no_aplica'`, `'en_proceso'` |
| `observacion` | VARCHAR(255) | — | — | Observación del técnico sobre este ítem |

**Claves foráneas**:
- `check_plantilla.id_check → checklist.id_check`
- `check_plantilla.id_ip → plantilla.id_ip`

**Clave primaria compuesta**: `(id_check, id_ip)` — un mismo ítem no puede estar dos veces en el mismo checklist.

---

### 4.23 `licencia`

**Descripción**: licencias de software adquiridas por la organización (sistema operativo, ofimática, antivirus, herramientas de productividad). El proveedor y la versión se referencian mediante FK a los catálogos `proveedor_licencia` y `version_licencia` en lugar de texto libre. Las licencias se asignan a empleados a través de la tabla intermedia `emp_lic`.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_lic` | SERIAL | PK | auto | Identificador único de la licencia |
| `fecha_ini` | DATE | — | — | Fecha de inicio de validez del contrato de licencia |
| `fecha_exp` | DATE | — | — | Fecha de expiración de la licencia |
| `id_prov` | INT | FK, NOT NULL | — | Proveedor del software licenciado |
| `id_ver` | INT | FK, NOT NULL | — | Versión del producto licenciado |

**Claves foráneas**:
- `licencia.id_prov → proveedor_licencia.id_prov`
- `licencia.id_ver → version_licencia.id_ver`

---

### 4.24 `emp_lic`

**Descripción**: tabla asociativa que materializa la relación N:N entre `empleado` y `licencia`. Permite registrar qué licencias se han asignado a cada empleado.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_emp` | INT | PK compuesta, FK, NOT NULL | — | Empleado al que se asigna la licencia |
| `id_lic` | INT | PK compuesta, FK, NOT NULL | — | Licencia asignada |

**Claves foráneas**:
- `emp_lic.id_emp → empleado.id_emp`
- `emp_lic.id_lic → licencia.id_lic`

**Clave primaria compuesta**: `(id_emp, id_lic)` — garantiza que un empleado no pueda tener la misma licencia asignada dos veces.

---

### 4.25 `tipo_estado`

**Descripción**: catálogo que describe la **condición física** de un activo tecnológico (estado de conservación), independiente de si se encuentra o no en uso. Se combina con `disponibilidad` a través de la tabla `estado_dispo` para restringir qué estados operativos son compatibles con cada condición (por ejemplo, un activo en condición `Malo` no debería poder marcarse como `disponible`).

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_tipoe` | SERIAL | PK | auto | Identificador único de la condición |
| `nombre` | VARCHAR(50) | NOT NULL, UNIQUE | — | Nombre de la condición |
| `descr` | TEXT | — | — | Descripción del significado de la condición |
| `operatividad` | BOOLEAN | NOT NULL | TRUE | Indica si la condición sigue siendo utilizada (soft-delete) |

**Claves foráneas**: ninguna.

**Datos semilla cargados**: `Bueno` (activo sin desperfectos físicos ni internos), `Regular` (activo con detalles estéticos o de funcionamiento), `Malo` (activo con problemas de funcionamiento o piezas dañadas).

---

### 4.26 `estado_dispo`

**Descripción**: tabla asociativa que materializa la relación N:N entre `tipo_estado` y `disponibilidad`, definiendo qué valores de disponibilidad son válidos para cada condición física de un activo. Es utilizada por el backend para validar la combinación condición/disponibilidad al crear o actualizar un `activo_ti`.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_tipoe` | INT | PK compuesta, FK, NOT NULL | — | Condición física del activo |
| `id_dispo` | INT | PK compuesta, FK, NOT NULL | — | Disponibilidad permitida para esa condición |

**Claves foráneas**:
- `estado_dispo.id_tipoe → tipo_estado.id_tipoe` (`ON DELETE CASCADE`)
- `estado_dispo.id_dispo → disponibilidad.id_dispo` (`ON DELETE CASCADE`)

**Clave primaria compuesta**: `(id_tipoe, id_dispo)`.

---

### 4.27 `activo_ti`

**Descripción**: tabla central del sistema. Registra los activos tecnológicos administrados por el área de Soporte e Infraestructura. Constituye la entidad padre de la jerarquía de especialización (`equipo_computo` y `periferico`). Los atributos `id_tipoe` (condición física) e `id_dispo` (disponibilidad operativa) denotan el estado actual del activo (denormalización para acceso rápido en consultas), mientras que el historial completo de cambios de condición se mantiene en la tabla `historial_estado`. `marca` y `modelo` se almacenan como texto libre siguiendo el patrón "Creatable Select"; los catálogos `marca` y `modelo` sólo alimentan las sugerencias del frontend.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_act` | SERIAL | PK | auto | Identificador único del activo |
| `modelo` | VARCHAR(50) | — | — | Modelo del equipo (texto libre) |
| `marca` | VARCHAR(50) | — | — | Marca del fabricante (texto libre) |
| `num_serie` | VARCHAR(50) | UNIQUE | — | Número de serie del fabricante |
| `tipo` | VARCHAR(20) | NOT NULL, CHECK | — | Discriminador del subtipo. Valores: `'equipo_computo'`, `'periferico'` |
| `origen` | VARCHAR(20) | NOT NULL, CHECK | — | Origen del activo. Valores: `'empresa'`, `'personal'` |
| `fecha_recep` | DATE | — | — | Fecha de recepción del activo |
| `id_fact` | INT | FK | — | Factura de adquisición (NULL si origen = `'personal'`) |
| `id_tipoe` | INT | FK, NOT NULL | — | Condición física actual del activo |
| `id_dispo` | INT | FK, NOT NULL | — | Disponibilidad operativa actual del activo |

**Claves foráneas**:
- `activo_ti.id_fact → factura.id_fact`
- `activo_ti.id_tipoe → tipo_estado.id_tipoe`
- `activo_ti.id_dispo → disponibilidad.id_dispo`

---

### 4.28 `equipo_computo`

**Descripción**: subtipo de `activo_ti` que representa equipos de cómputo (notebooks, gabinetes, NUCs, tablets). Contiene atributos técnicos específicos de hardware y configuración. El tipo de equipo y el sistema operativo instalado se referencian mediante FK a los catálogos `tipo_equipo` y `edicion_so` respectivamente, en lugar de texto libre. La PK es compartida con `activo_ti` (patrón "tabla por subclase").

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_act` | INT | PK, FK, NOT NULL | — | Identificador del activo (compartido con `activo_ti.id_act`) |
| `ram_capac` | INT | — | — | Capacidad de memoria RAM (valor numérico) |
| `ram_tipo` | VARCHAR(10) | — | — | Tipo de RAM (DDR3, DDR4, etc.) |
| `cpu` | VARCHAR(50) | — | — | Modelo del procesador |
| `mac_ethernet` | VARCHAR(17) | — | — | Dirección MAC de la interfaz cableada (formato `AA:BB:CC:DD:EE:FF`) |
| `mac_wifi` | VARCHAR(17) | — | — | Dirección MAC de la interfaz inalámbrica |
| `disco_capac` | INT | — | — | Capacidad numérica del disco |
| `disco_tipo` | VARCHAR(10) | CHECK | — | Tipo de disco. Valores: `'HDD'`, `'SSD'`, `'NVMe'`, `'eMMC'` |
| `disco_unidad` | VARCHAR(5) | CHECK | — | Unidad de medida del disco. Valores: `'MB'`, `'GB'`, `'TB'` |
| `host_name` | VARCHAR(50) | — | — | Nombre del host en la red |
| `id_tipoeq` | INT | FK | — | Subtipo de equipo (notebook, gabinete, NUC, tablet) |
| `id_edicion_so` | INT | FK | — | Edición del sistema operativo instalado |

**Claves foráneas**:
- `equipo_computo.id_act → activo_ti.id_act`
- `equipo_computo.id_tipoeq → tipo_equipo.id_tipoeq`
- `equipo_computo.id_edicion_so → edicion_so.id_edicion_so`

---

### 4.29 `periferico`

**Descripción**: subtipo de `activo_ti` que representa periféricos de oficina (pantallas, impresoras, UPS). Contiene atributos técnicos genéricos que permiten almacenar valores heterogéneos según el tipo de periférico (pulgadas para pantallas, capacidad VA para UPS, etc.). El tipo de periférico se referencia mediante FK al catálogo `tipo_periferico` en lugar de texto libre.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_act` | INT | PK, FK, NOT NULL | — | Identificador del activo (compartido con `activo_ti.id_act`) |
| `valor_tec` | DECIMAL | — | — | Valor técnico genérico (ej. 23.8, 1000) |
| `u_medida` | VARCHAR(50) | — | — | Unidad de medida del valor técnico (pulgadas, VA, ppm) |
| `obs_perif` | TEXT | — | — | Observaciones técnicas adicionales |
| `id_tipoper` | INT | FK | — | Tipo específico de periférico (pantalla, UPS, impresora) |

**Claves foráneas**:
- `periferico.id_act → activo_ti.id_act`
- `periferico.id_tipoper → tipo_periferico.id_tipoper`

---

### 4.30 `historial_estado`

**Descripción**: bitácora de auditoría que registra cada cambio de condición física de un activo a lo largo de su ciclo de vida. Permite reconstruir la historia completa de transiciones del activo, satisfaciendo el requisito de trazabilidad establecido en la propuesta del proyecto. Además de la condición y la causa, registra opcionalmente el usuario del sistema que efectuó el cambio.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_hes` | SERIAL | PK | auto | Identificador único del registro de historial |
| `fecha_reg` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Fecha y hora del cambio de condición |
| `descr` | TEXT | — | — | Descripción del cambio |
| `causa` | VARCHAR(50) | NOT NULL | — | Causa que motivó el cambio de condición |
| `id_tipoe` | INT | FK, NOT NULL | — | Condición a la que transicionó el activo |
| `id_act` | INT | FK, NOT NULL | — | Activo al que pertenece el registro |
| `id_emp_reg` | INT | FK | — | Usuario del sistema que registró el cambio |

**Claves foráneas**:
- `historial_estado.id_tipoe → tipo_estado.id_tipoe`
- `historial_estado.id_act → activo_ti.id_act`
- `historial_estado.id_emp_reg → usuario_sistema.id_emp`

---

### 4.31 `asignacion`

**Descripción**: registra cada asignación de un activo a un empleado, con sus fechas de entrega y devolución. Permite preservar el historial completo de asignaciones a lo largo de la vida útil del activo, evitando la sobrescritura que ocurría en el sistema previo basado en hojas de cálculo. La columna `operatividad` presente en versiones anteriores del esquema fue eliminada, ya que la vigencia de la asignación se determina directamente por `fecha_dev IS NULL`.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_asig` | SERIAL | PK | auto | Identificador único de la asignación |
| `fecha_entr` | DATE | NOT NULL | — | Fecha de entrega del activo al empleado |
| `fecha_dev` | DATE | — | — | Fecha de devolución (NULL mientras la asignación esté vigente) |
| `ruta_acta_entr` | VARCHAR(255) | — | — | Ruta del acta de entrega firmada |
| `id_act` | INT | FK, NOT NULL | — | Activo asignado |
| `id_emp` | INT | FK, NOT NULL | — | Empleado al que se asigna el activo |
| `id_emp_reg` | INT | FK | — | Usuario del sistema que procesó la asignación |

**Claves foráneas**:
- `asignacion.id_act → activo_ti.id_act`
- `asignacion.id_emp → empleado.id_emp`
- `asignacion.id_emp_reg → usuario_sistema.id_emp`

---

## 5. Resumen de relaciones del modelo

| Relación | Cardinalidad | Tabla con FK |
| --- | --- | --- |
| version_so → familia_so | N:1 | version_so.id_fam_so |
| edicion_so → version_so | N:1 | edicion_so.id_ver_so |
| modelo → marca | N:1 | modelo.id_marca |
| version_licencia → proveedor_licencia | N:1 | version_licencia.id_prov |
| factura → proveedor_factura | N:1 | factura.id_prov_fact |
| departamento → empresa | N:1 | departamento.id_org |
| sub_area → departamento | N:1 | sub_area.id_dpto |
| empleado → cargo | N:1 | empleado.id_cargo |
| empleado → planta | N:1 | empleado.id_planta |
| empleado → departamento | N:1 | empleado.id_dpto |
| empleado → sub_area | N:1 | empleado.id_sub |
| usuario_sistema → empleado | 1:1 | usuario_sistema.id_emp |
| checklist → usuario_sistema | N:1 | checklist.id_emp |
| check_plantilla → checklist | N:1 | check_plantilla.id_check |
| check_plantilla → plantilla | N:1 | check_plantilla.id_ip |
| licencia → proveedor_licencia | N:1 | licencia.id_prov |
| licencia → version_licencia | N:1 | licencia.id_ver |
| emp_lic → empleado | N:1 | emp_lic.id_emp |
| emp_lic → licencia | N:1 | emp_lic.id_lic |
| estado_dispo → tipo_estado | N:1 | estado_dispo.id_tipoe |
| estado_dispo → disponibilidad | N:1 | estado_dispo.id_dispo |
| activo_ti → factura | N:1 | activo_ti.id_fact |
| activo_ti → tipo_estado | N:1 | activo_ti.id_tipoe |
| activo_ti → disponibilidad | N:1 | activo_ti.id_dispo |
| equipo_computo → activo_ti | 1:1 | equipo_computo.id_act |
| equipo_computo → tipo_equipo | N:1 | equipo_computo.id_tipoeq |
| equipo_computo → edicion_so | N:1 | equipo_computo.id_edicion_so |
| periferico → activo_ti | 1:1 | periferico.id_act |
| periferico → tipo_periferico | N:1 | periferico.id_tipoper |
| historial_estado → activo_ti | N:1 | historial_estado.id_act |
| historial_estado → tipo_estado | N:1 | historial_estado.id_tipoe |
| historial_estado → usuario_sistema | N:1 | historial_estado.id_emp_reg |
| asignacion → activo_ti | N:1 | asignacion.id_act |
| asignacion → empleado | N:1 | asignacion.id_emp |
| asignacion → usuario_sistema | N:1 | asignacion.id_emp_reg |

---

## 6. Decisiones de diseño relevantes

**Herencia tabla por subclase.** Las jerarquías `activo_ti → {equipo_computo, periferico}` y `empleado → usuario_sistema` se modelan mediante el patrón "tabla por subclase" (table-per-subclass), donde la PK del hijo es a la vez FK al padre [4]. Este patrón evita la duplicación de atributos y permite aplicar restricciones e índices a la entidad padre.

**Catálogos con creación en línea ("Creatable Select").** Los atributos que antes eran texto libre (empresa, cargo, planta, tipo de equipo, tipo de periférico, sistema operativo, proveedores y versiones de licencia y factura) se normalizaron en tablas de catálogo dedicadas. El frontend permite elegir un valor existente o crear uno nuevo sin salir del formulario, lo que mantiene la consistencia terminológica sin exigir un mantenimiento previo de catálogos por parte de un administrador. Como excepción, `activo_ti.marca` y `activo_ti.modelo` se mantienen como texto libre denormalizado: los catálogos `marca` y `modelo` sólo alimentan las sugerencias de autocompletado, sin FK directa desde `activo_ti`.

**Catálogos dependientes en cascada.** Algunos catálogos sólo tienen sentido en el contexto de un catálogo padre y se cargan en el frontend de forma escalonada: `familia_so → version_so → edicion_so` (sistema operativo), `marca → modelo`, `proveedor_licencia → version_licencia` y `departamento → sub_area`. Esto evita listas planas de cientos de combinaciones y refleja la jerarquía real del dominio.

**Separación entre condición física y disponibilidad operativa.** El estado de un activo se modela con dos catálogos independientes: `tipo_estado` (condición física de conservación: `Bueno`, `Regular`, `Malo`) y `disponibilidad` (estado operativo frente al usuario, con color asociado para la interfaz). La tabla `estado_dispo` define qué combinaciones de condición/disponibilidad son válidas, y el backend valida esta combinación antes de persistir un `activo_ti`.

**Denormalización del estado actual.** Las columnas `activo_ti.id_tipoe` e `id_dispo` mantienen una copia de la condición y disponibilidad más recientes del activo, mientras `historial_estado` conserva el log completo de cambios de condición. Esta decisión privilegia el rendimiento de las consultas de listado en el dashboard frente a la pureza de la tercera forma normal. La consistencia entre ambas tablas se mantiene a nivel de aplicación dentro de transacciones.

**Soft-delete.** Las entidades sensibles a desactivación (`empleado.operatividad`, `tipo_estado.operatividad`, `usuario_sistema.vigente`) implementan borrado lógico para preservar la integridad referencial y la auditabilidad histórica, en lugar de borrado físico. La vigencia de una `asignacion` ya no depende de un flag booleano, sino de si `fecha_dev` es NULL.

**Restricciones CHECK para enumeraciones.** Los campos discriminadores y de rol con un conjunto cerrado y estable de valores (`activo_ti.tipo`, `activo_ti.origen`, `usuario_sistema.rol`, `departamento.zona`, `check_plantilla.estado`, `equipo_computo.disco_tipo`, `equipo_computo.disco_unidad`) utilizan restricciones CHECK con listas de valores permitidos, en lugar de tipos ENUM nativos de PostgreSQL. Esto facilita la portabilidad del esquema y la modificación de los valores admitidos mediante migraciones.

---

## 7. Referencias

[1] ISO/IEC/IEEE. (2018). *ISO/IEC/IEEE 29148:2018 — Systems and software engineering — Life cycle processes — Requirements engineering*. International Organization for Standardization.

[2] ISO/IEC. (2015). *ISO/IEC 11179-1:2015 — Information technology — Metadata registries (MDR) — Part 1: Framework*. International Organization for Standardization.

[3] DATE, C. J. (2003). *An Introduction to Database Systems*, 8th edition. Boston: Addison-Wesley.

[4] ELMASRI, R. and NAVATHE, S. B. (2017). *Fundamentals of Database Systems*, 7th edition. Boston: Pearson.

[5] OWASP Foundation. (2023). *Password Storage Cheat Sheet*. Disponible en: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

[6] AXELOS. (2019). *ITIL Foundation: ITIL 4 Edition*. London: The Stationery Office.
