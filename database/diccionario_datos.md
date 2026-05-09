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

---

### 4.1 `departamento`

**Descripción**: representa las unidades organizacionales del Holding Leonera (subsidiarias y áreas internas) a las que pertenecen los empleados. Cada departamento se asocia a una empresa subsidiaria y a una zona geográfica.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_dpto` | SERIAL | PK | auto | Identificador único del departamento |
| `empresa` | VARCHAR(50) | NOT NULL | — | Nombre de la empresa subsidiaria del Holding |
| `zona` | VARCHAR(50) | NOT NULL | — | Zona geográfica donde opera el departamento |
| `subarea` | VARCHAR(50) | NOT NULL | — | Subárea funcional dentro del departamento |

**Claves foráneas**: ninguna.

---

### 4.2 `empleado`

**Descripción**: registra a las personas que trabajan en alguna de las empresas del holding. Un empleado puede recibir activos tecnológicos en asignación. La columna `operatividad` permite el soft-delete cuando un empleado deja la organización, preservando el historial sin borrado físico.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_emp` | SERIAL | PK | auto | Identificador único del empleado |
| `rut` | VARCHAR(50) | NOT NULL, UNIQUE | — | Rol único tributario del empleado |
| `nombre` | VARCHAR(50) | NOT NULL | — | Nombre completo del empleado |
| `email` | VARCHAR(50) | NOT NULL, UNIQUE | — | Correo corporativo del empleado |
| `cargo` | VARCHAR(50) | NOT NULL | — | Cargo actual dentro de la organización |
| `planta` | VARCHAR(50) | NOT NULL | — | Planta o instalación física donde trabaja |
| `operatividad` | BOOLEAN | NOT NULL | TRUE | Indica si el empleado se encuentra vigente en la empresa |
| `id_dpto` | INT | FK | — | Departamento al que pertenece |

**Claves foráneas**:
- `empleado.id_dpto → departamento.id_dpto`

---

### 4.3 `informatico`

**Descripción**: subtipo de `empleado` que representa al personal del área de Soporte e Infraestructura del Departamento de Transformación Digital. Un informático puede autenticarse en el sistema y ejecutar acciones operativas (asignar activos, ejecutar checklists, registrar cambios de estado). Implementa la herencia 1:1 sobre `empleado` mediante PK compartida.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_emp` | INT | PK, FK | — | Identificador del empleado (compartido con `empleado.id_emp`) |
| `hash_pass` | VARCHAR(255) | NOT NULL | — | Hash de la contraseña generado con bcrypt (irreversible) |
| `rol` | VARCHAR(20) | NOT NULL, CHECK | — | Rol funcional. Valores permitidos: `'editor'`, `'viewer'` |

**Claves foráneas**:
- `informatico.id_emp → empleado.id_emp`

**Notas de implementación**: el hash de contraseña se genera con el algoritmo bcrypt mediante la librería `passlib`, conforme a las recomendaciones de OWASP para almacenamiento seguro de credenciales [5]. La contraseña en texto plano nunca se persiste en la base de datos.

---

### 4.4 `licencia`

**Descripción**: licencias de software adquiridas por la organización (sistema operativo, ofimática, antivirus, herramientas de productividad). Las licencias se asignan a empleados a través de la tabla intermedia `emp_lic`.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_lic` | SERIAL | PK | auto | Identificador único de la licencia |
| `fecha_ini` | DATE | — | — | Fecha de inicio de validez |
| `fecha_exp` | DATE | — | — | Fecha de expiración de la licencia |
| `proveedor` | VARCHAR(50) | NOT NULL | — | Proveedor del software |
| `ver_licen` | VARCHAR(50) | NOT NULL | — | Versión del producto licenciado |

**Claves foráneas**: ninguna.

---

### 4.5 `emp_lic`

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

### 4.6 `tipo_estado`

**Descripción**: catálogo de estados posibles que puede atravesar un activo tecnológico durante su ciclo de vida. Permite mantener consistencia terminológica al evitar valores libres en las columnas de estado.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_tipoe` | SERIAL | PK | auto | Identificador único del tipo de estado |
| `nombre` | VARCHAR(50) | NOT NULL, UNIQUE | — | Nombre del estado |
| `descr` | TEXT | — | — | Descripción del significado del estado |
| `operatividad` | BOOLEAN | NOT NULL | TRUE | Indica si el tipo de estado sigue siendo utilizado |

**Claves foráneas**: ninguna.

**Datos semilla cargados**: `disponible`, `en_preparacion`, `asignado`, `en_mantencion`, `de_baja`. Estos cinco estados constituyen el ciclo de vida estándar de un activo según el marco de referencia ITIL 4 para la gestión de activos de TI [6].

---

### 4.7 `factura`

**Descripción**: registra las facturas asociadas a la adquisición de activos tecnológicos por parte de la empresa. Solo aplica para activos con origen `'empresa'`; los activos personales (origen `'personal'`) no tienen factura asociada.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_fact` | SERIAL | PK | auto | Identificador único de la factura |
| `prov_fact` | VARCHAR(50) | NOT NULL | — | Proveedor que emitió la factura |
| `fecha_em` | DATE | — | — | Fecha de emisión de la factura |
| `num_folio` | INT | NOT NULL, UNIQUE | — | Número de folio de la factura |
| `ruta_pdf_fact` | VARCHAR(200) | NOT NULL | — | Ruta del archivo PDF de la factura en el almacenamiento |

**Claves foráneas**: ninguna.

---

### 4.8 `activo_ti`

**Descripción**: tabla central del sistema. Registra los activos tecnológicos administrados por el área de Soporte e Infraestructura. Constituye la entidad padre de la jerarquía de especialización (`equipo_computo` y `periferico`). El atributo `id_tipoe` denota el estado actual del activo (denormalización para acceso rápido en consultas), mientras que el historial completo de cambios se mantiene en la tabla `historial_estado`.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id` | SERIAL | PK | auto | Identificador único del activo |
| `modelo` | VARCHAR(50) | — | — | Modelo del equipo |
| `marca` | VARCHAR(50) | — | — | Marca del fabricante |
| `num_serie` | VARCHAR(50) | UNIQUE | — | Número de serie del fabricante |
| `disponibilidad` | BOOLEAN | NOT NULL | TRUE | Indica si el activo está disponible para asignar |
| `tipo` | VARCHAR(20) | NOT NULL, CHECK | — | Discriminador del subtipo. Valores: `'equipo_computo'`, `'periferico'` |
| `origen` | VARCHAR(20) | NOT NULL, CHECK | — | Origen del activo. Valores: `'empresa'`, `'personal'` |
| `id_fact` | INT | FK | — | Factura de adquisición (NULL si origen = `'personal'`) |
| `id_tipoe` | INT | FK | — | Estado actual del activo (referencia al catálogo de tipos) |

**Claves foráneas**:
- `activo_ti.id_fact → factura.id_fact`
- `activo_ti.id_tipoe → tipo_estado.id_tipoe`

---

### 4.9 `equipo_computo`

**Descripción**: subtipo de `activo_ti` que representa equipos de cómputo (notebooks, gabinetes, NUCs, tablets). Contiene atributos técnicos específicos de hardware y configuración. La PK es compartida con `activo_ti` (patrón "tabla por subclase").

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id` | INT | PK, FK, NOT NULL | — | Identificador del activo (compartido con `activo_ti.id`) |
| `ram_capac` | INT | — | — | Capacidad de memoria RAM (valor numérico) |
| `ram_tipo` | VARCHAR(10) | — | — | Tipo de RAM (DDR3, DDR4, etc.) |
| `sist_op` | VARCHAR(50) | — | — | Sistema operativo instalado |
| `cpu` | VARCHAR(50) | — | — | Modelo del procesador |
| `mac_ethernet` | VARCHAR(20) | — | — | Dirección MAC de la interfaz cableada |
| `mac_wifi` | VARCHAR(20) | — | — | Dirección MAC de la interfaz inalámbrica |
| `disco_un` | VARCHAR(10) | — | — | Unidad de medida del disco (GB, TB) |
| `disco_tipo` | VARCHAR(20) | — | — | Tipo de disco (SSD, HDD, NVMe) |
| `disco_capac` | INT | — | — | Capacidad numérica del disco |
| `host_name` | VARCHAR(50) | — | — | Nombre del host en la red |
| `tipo_equipo` | VARCHAR(50) | — | — | Subtipo de equipo (notebook, gabinete, NUC, tablet) |

**Claves foráneas**:
- `equipo_computo.id → activo_ti.id`

---

### 4.10 `periferico`

**Descripción**: subtipo de `activo_ti` que representa periféricos de oficina (pantallas, impresoras, UPS). Contiene atributos técnicos genéricos que permiten almacenar valores heterogéneos según el tipo de periférico (pulgadas para pantallas, capacidad VA para UPS, etc.).

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id` | INT | PK, FK, NOT NULL | — | Identificador del activo (compartido con `activo_ti.id`) |
| `tipo_per` | VARCHAR(50) | — | — | Tipo específico de periférico (pantalla, UPS, impresora) |
| `valor_tec` | DECIMAL | — | — | Valor técnico genérico (ej. 23.8, 1000) |
| `u_medida` | VARCHAR(50) | — | — | Unidad de medida del valor técnico (pulgadas, VA, ppm) |
| `obs_perif` | TEXT | — | — | Observaciones técnicas adicionales |

**Claves foráneas**:
- `periferico.id → activo_ti.id`

---

### 4.11 `historial_estado`

**Descripción**: bitácora de auditoría que registra cada cambio de estado de un activo a lo largo de su ciclo de vida. Permite reconstruir la historia completa de transiciones de estado del activo, satisfaciendo el requisito de trazabilidad establecido en la propuesta del proyecto.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_hes` | SERIAL | PK | auto | Identificador único del registro de historial |
| `fecha_reg` | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Fecha y hora del cambio de estado |
| `descr` | TEXT | — | — | Descripción del cambio |
| `causa` | VARCHAR(50) | NOT NULL | — | Causa que motivó el cambio de estado |
| `id_tipoe` | INT | FK, NOT NULL | — | Tipo de estado al que transicionó el activo |
| `id_activo` | INT | FK, NOT NULL | — | Activo al que pertenece el registro |

**Claves foráneas**:
- `historial_estado.id_tipoe → tipo_estado.id_tipoe`
- `historial_estado.id_activo → activo_ti.id`

---

### 4.12 `asignacion`

**Descripción**: registra cada asignación de un activo a un empleado, con sus fechas de entrega y devolución. Permite preservar el historial completo de asignaciones a lo largo de la vida útil del activo, evitando la sobrescritura que ocurría en el sistema previo basado en hojas de cálculo.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_asig` | SERIAL | PK | auto | Identificador único de la asignación |
| `fecha_entr` | DATE | NOT NULL | — | Fecha de entrega del activo al empleado |
| `fecha_dev` | DATE | — | — | Fecha de devolución (NULL mientras la asignación esté vigente) |
| `ruta_acta_entr` | VARCHAR(255) | — | — | Ruta del acta de entrega firmada |
| `operatividad` | BOOLEAN | NOT NULL | TRUE | Indica si la asignación está vigente |
| `id` | INT | FK | — | Activo asignado |
| `id_emp` | INT | FK | — | Empleado al que se asigna el activo |

**Claves foráneas**:
- `asignacion.id → activo_ti.id`
- `asignacion.id_emp → empleado.id_emp`

---

### 4.13 `checklist`

**Descripción**: representa una ejecución concreta de una checklist de preparación técnica de un activo, realizada por un informático. Cada checklist se compone de varios ítems mediante la tabla `check_plantilla`.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_check` | SERIAL | PK | auto | Identificador único de la ejecución |
| `nombre` | VARCHAR(50) | NOT NULL | — | Nombre descriptivo de la ejecución |
| `fecha_ini` | DATE | — | — | Fecha de inicio del checklist |
| `fecha_ter` | DATE | — | — | Fecha de finalización del checklist |
| `id_emp` | INT | FK | — | Informático que ejecuta el checklist |

**Claves foráneas**:
- `checklist.id_emp → informatico.id_emp`

---

### 4.14 `plantilla`

**Descripción**: catálogo de ítems reutilizables que pueden formar parte de un checklist de preparación. Por ejemplo: "Instalar sistema operativo", "Configurar red corporativa", "Instalar antivirus".

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_ip` | SERIAL | PK | auto | Identificador único del ítem de plantilla |
| `descr` | TEXT | — | — | Descripción del ítem |
| `orden` | INT | NOT NULL | — | Orden de ejecución sugerido |

**Claves foráneas**: ninguna.

---

### 4.15 `check_plantilla`

**Descripción**: tabla asociativa que materializa la relación N:N entre `checklist` y `plantilla`. Para cada ítem incluido en un checklist, registra el estado de cumplimiento y observaciones específicas de esa ejecución.

| Atributo | Tipo | Restricciones | Default | Descripción |
| --- | --- | --- | --- | --- |
| `id_check` | INT | PK compuesta, FK, NOT NULL | — | Checklist del que forma parte |
| `id_ip` | INT | PK compuesta, FK, NOT NULL | — | Ítem de plantilla incluido |
| `estado` | VARCHAR(50) | NOT NULL | — | Estado del ítem en esta ejecución (pendiente, ok, no_aplica) |
| `observacion` | VARCHAR(255) | — | — | Observación del técnico sobre este ítem |

**Claves foráneas**:
- `check_plantilla.id_check → checklist.id_check`
- `check_plantilla.id_ip → plantilla.id_ip`

**Clave primaria compuesta**: `(id_check, id_ip)` — un mismo ítem no puede estar dos veces en el mismo checklist.

---

## 5. Resumen de relaciones del modelo

| Relación | Cardinalidad | Tabla con FK |
| --- | --- | --- |
| empleado → departamento | N:1 | empleado.id_dpto |
| informatico → empleado | 1:1 | informatico.id_emp |
| activo_ti → factura | N:1 | activo_ti.id_fact |
| activo_ti → tipo_estado | N:1 | activo_ti.id_tipoe |
| equipo_computo → activo_ti | 1:1 | equipo_computo.id |
| periferico → activo_ti | 1:1 | periferico.id |
| historial_estado → activo_ti | N:1 | historial_estado.id_activo |
| historial_estado → tipo_estado | N:1 | historial_estado.id_tipoe |
| asignacion → activo_ti | N:1 | asignacion.id |
| asignacion → empleado | N:1 | asignacion.id_emp |
| checklist → informatico | N:1 | checklist.id_emp |
| check_plantilla → checklist | N:1 | check_plantilla.id_check |
| check_plantilla → plantilla | N:1 | check_plantilla.id_ip |
| emp_lic → empleado | N:1 | emp_lic.id_emp |
| emp_lic → licencia | N:1 | emp_lic.id_lic |

---

## 6. Decisiones de diseño relevantes

**Herencia tabla por subclase.** Las jerarquías `activo_ti → {equipo_computo, periferico}` y `empleado → informatico` se modelan mediante el patrón "tabla por subclase" (table-per-subclass), donde la PK del hijo es a la vez FK al padre [4]. Este patrón evita la duplicación de atributos y permite aplicar restricciones e índices a la entidad padre.

**Denormalización del estado actual.** La columna `activo_ti.id_tipoe` mantiene una copia del estado más reciente del activo, mientras `historial_estado` conserva el log completo de cambios. Esta decisión privilegia el rendimiento de las consultas de listado en el dashboard frente a la pureza de la tercera forma normal. La consistencia entre ambas tablas se mantiene a nivel de aplicación dentro de transacciones.

**Soft-delete.** Las entidades sensibles a desactivación (`empleado.operatividad`, `tipo_estado.operatividad`, `asignacion.operatividad`) implementan borrado lógico para preservar la integridad referencial y la auditabilidad histórica, en lugar de borrado físico.

**Restricciones CHECK para enumeraciones.** Los campos discriminadores y de rol (`activo_ti.tipo`, `activo_ti.origen`, `informatico.rol`) utilizan restricciones CHECK con listas de valores permitidos, en lugar de tipos ENUM nativos de PostgreSQL. Esto facilita la portabilidad del esquema y la modificación de los valores admitidos mediante migraciones.

---

## 7. Referencias

[1] ISO/IEC/IEEE. (2018). *ISO/IEC/IEEE 29148:2018 — Systems and software engineering — Life cycle processes — Requirements engineering*. International Organization for Standardization.

[2] ISO/IEC. (2015). *ISO/IEC 11179-1:2015 — Information technology — Metadata registries (MDR) — Part 1: Framework*. International Organization for Standardization.

[3] DATE, C. J. (2003). *An Introduction to Database Systems*, 8th edition. Boston: Addison-Wesley.

[4] ELMASRI, R. and NAVATHE, S. B. (2017). *Fundamentals of Database Systems*, 7th edition. Boston: Pearson.

[5] OWASP Foundation. (2023). *Password Storage Cheat Sheet*. Disponible en: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

[6] AXELOS. (2019). *ITIL Foundation: ITIL 4 Edition*. London: The Stationery Office.
