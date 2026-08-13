-- ===================================
-- SiGAT 
-- Script de inicialización de BD
-- PostgreSQL 16
-- v2- Tablas catálogos + CHECK constraints
-- Enumeraciones normalizadas (Title Case) compartidas por BD, API y frontend.
-- ===================================

 
-- ========================================================
-- ============== CATÁLOGOS SIMPLES =======================
-- ========================================================
-- Tablas de referencia independientes.
-- El frontend usa "Creatable Select": el usuario elige de la
-- lista o agrega una opción nueva sin salir del formulario.
 
CREATE TABLE empresa (
    id_org SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE cargo (
    id_cargo SERIAL PRIMARY KEY,
    nombre   VARCHAR(100) NOT NULL UNIQUE
);
 
CREATE TABLE planta (
    id_planta SERIAL PRIMARY KEY,
    nombre    VARCHAR(100) NOT NULL UNIQUE
);
 
CREATE TABLE tipo_equipo (
    id_tipoeq SERIAL PRIMARY KEY,
    nombre    VARCHAR(100) NOT NULL UNIQUE   -- 'Notebook', 'Tablet', 'NUC', etc.
);
 

CREATE TABLE familia_so (
    id_fam_so SERIAL PRIMARY KEY,
    nombre    VARCHAR(100) NOT NULL UNIQUE      -- 'Windows', 'Linux', 'MacOS'
);

CREATE TABLE version_so (
    id_ver_so  SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,      -- '11', 'Ubuntu', '10'
    UNIQUE (id_ver_so, nombre),

    id_fam_so   INT NOT NULL REFERENCES familia_so(id_fam_so) ON DELETE CASCADE
);

CREATE TABLE edicion_so (
    id_edicion_so   SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,     --'Pro x64', 'Home', 'LTS'
    
    id_ver_so INT NOT NULL REFERENCES version_so(id_ver_so) ON DELETE CASCADE
);

 
CREATE TABLE tipo_periferico (
    id_tipoper SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL UNIQUE  -- 'Monitor', 'Impresora', etc.
);

CREATE TABLE marca (
    id_marca SERIAL PRIMARY KEY,
    nombre   VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE modelo (
    id_modelo SERIAL PRIMARY KEY,
    id_marca  INT NOT NULL REFERENCES marca(id_marca) ON DELETE CASCADE,
    nombre    VARCHAR(100) NOT NULL,
    UNIQUE (id_marca, nombre)
);
 
CREATE TABLE proveedor_licencia (
    id_prov SERIAL PRIMARY KEY,
    nombre  VARCHAR(100) NOT NULL UNIQUE     -- 'Office', 'Windows', 'Sophos'
);

CREATE TABLE disponibilidad (
    id_dispo    SERIAL PRIMARY KEY,
    nombre      VARCHAR (100) NOT NULL UNIQUE,
    descr       VARCHAR (100) NOT NULL,
    color       VARCHAR (20)
);
 

-- ========================================================
-- ============= CATÁLOGOS DEPENDIENTES ===================
-- ========================================================
-- Sus opciones dependen de otro catálogo.
-- El frontend solo carga estas opciones DESPUÉS de elegir
-- el catálogo padre (cascading / dropdown dependiente).
 
-- version_licencia depende de proveedor_licencia
-- Ej: "Office" → ["2019", "365"]  |  "Windows" → ["Enterprise", "Server"]
CREATE TABLE version_licencia (
    id_ver  SERIAL PRIMARY KEY,
    id_prov INT NOT NULL REFERENCES proveedor_licencia(id_prov) ON DELETE CASCADE,
    nombre  VARCHAR(100) NOT NULL,
    UNIQUE (id_prov, nombre)   -- no puede existir la misma versión dos veces para el mismo proveedor
);
 
-- sub_area depende de departamento
-- Ej: "TD" → ["Soporte", "Desarrollo", "BI"]
-- Se crea DESPUÉS de la tabla departamento.


--========================================================
--======================= FACTURA ========================
--========================================================


CREATE TABLE factura (
    id_fact       SERIAL PRIMARY KEY,
    fecha_em      DATE,
    ruta_pdf_fact VARCHAR(200) NOT NULL
);

--========================================================
--=================== DEPARTAMENTO =======================
--========================================================
CREATE TABLE departamento (
    id_dpto         SERIAL PRIMARY KEY,
    zona            VARCHAR(50) CHECK (zona IN ('Administracion', 'Operaciones', 'Produccion')),
    nom_dpto        VARCHAR(100),

    id_org          INT NOT NULL REFERENCES empresa(id_org)
);


--CATALOGO DEPENDIENTE
CREATE TABLE sub_area (
    id_sub  SERIAL PRIMARY KEY,
    id_dpto INT NOT NULL REFERENCES departamento(id_dpto) ON DELETE CASCADE,
    
    nombre  VARCHAR(100) NOT NULL,
    UNIQUE (id_dpto, nombre)
);
 


--========================================================
--======================= EMPLEADO =======================
--========================================================

CREATE TABLE empleado (
    id_emp       SERIAL PRIMARY KEY,
    rut          VARCHAR(50) NOT NULL UNIQUE,
    nombre       VARCHAR(50) NOT NULL,
    email        VARCHAR(50) NOT NULL UNIQUE,
    operatividad BOOLEAN NOT NULL DEFAULT TRUE,

    id_cargo  INT NOT NULL REFERENCES cargo(id_cargo),
    id_planta INT NOT NULL REFERENCES planta(id_planta),
    id_dpto   INT REFERENCES departamento(id_dpto),
    id_sub    INT REFERENCES sub_area(id_sub)   -- opcional: no todos tienen subárea
);

CREATE TABLE usuario_sistema (
    id_usuario SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    hash_pass  VARCHAR(255) NOT NULL,
    rol        VARCHAR(20)  NOT NULL CHECK (rol IN ('Editor', 'Auditor', 'Admin')),
    vigente    BOOLEAN NOT NULL DEFAULT TRUE
);



--========================================================
--==================== EMPLEADO/LICENCIA =================
--========================================================

CREATE TABLE emp_lic (
    id_emp            INT NOT NULL,
    id_ver            INT NOT NULL,
    fecha_asignacion  DATE NOT NULL,

    PRIMARY KEY (id_emp, id_ver),
    FOREIGN KEY (id_emp) references empleado(id_emp),
    FOREIGN KEY (id_ver) references version_licencia(id_ver)
);

--========================================================
--============== TIPO ESTADO      ========================
--========================================================


CREATE TABLE tipo_estado (
    id_tipoe        SERIAL PRIMARY KEY,
    nombre          VARCHAR(50) NOT NULL UNIQUE
                    CHECK (nombre IN ('Bueno', 'Regular', 'Malo')),
    descr           TEXT,
    operatividad    BOOLEAN NOT NULL DEFAULT TRUE
);

-- Relación N:M: qué disponibilidades permite cada estado (condición del equipo)
CREATE TABLE estado_dispo (
    id_tipoe    INT NOT NULL REFERENCES tipo_estado(id_tipoe) ON DELETE CASCADE,
    id_dispo    INT NOT NULL REFERENCES disponibilidad(id_dispo) ON DELETE CASCADE,
    PRIMARY KEY (id_tipoe, id_dispo)
);


--========================================================
--======================= ACTIVO_TI ======================
--========================================================

CREATE TABLE activo_ti (
    id_act         SERIAL PRIMARY KEY,
    num_serie      VARCHAR(50) UNIQUE,
    tipo           VARCHAR(20) NOT NULL CHECK (tipo   IN ('Equipo Computo', 'Periferico')),
    origen         VARCHAR(20) NOT NULL CHECK (origen IN ('Empresa', 'Personal')),
    fecha_recep    DATE,

    id_modelo      INT NOT NULL REFERENCES modelo(id_modelo),
    id_fact        INT REFERENCES factura(id_fact),
    id_tipoe       INT NOT NULL REFERENCES tipo_estado(id_tipoe),
    id_dispo       INT NOT NULL REFERENCES disponibilidad(id_dispo)
);

CREATE TABLE equipo_computo (
    id_act       INT NOT NULL,
    ram_capac    INT,
    ram_tipo     VARCHAR(10),
    cpu          VARCHAR(50),
    mac_ethernet VARCHAR(17),          -- formato AA:BB:CC:DD:EE:FF
    mac_wifi     VARCHAR(17),
    disco_capac  INT,
    disco_tipo   VARCHAR(10) CHECK (disco_tipo   IN ('HDD', 'SSD', 'NVMe', 'eMMC')),
    disco_unidad VARCHAR(5)  CHECK (disco_unidad IN ('MB', 'GB', 'TB')),
    host_name    VARCHAR(50),
 
    id_tipoeq       INT REFERENCES tipo_equipo(id_tipoeq),
    id_edicion_so   INT REFERENCES edicion_so(id_edicion_so),
 
    PRIMARY KEY (id_act),
    FOREIGN KEY (id_act) REFERENCES activo_ti(id_act)

);

CREATE TABLE periferico (
    id_act     INT NOT NULL,
    valor_tec  DECIMAL,
    u_medida   VARCHAR(50),
    obs_perif  TEXT,
 
    id_tipoper INT REFERENCES tipo_periferico(id_tipoper),
 
    PRIMARY KEY (id_act),
    FOREIGN KEY (id_act) REFERENCES activo_ti(id_act)
);

--========================================================
--================== Historial del estado ================
--========================================================

CREATE TABLE historial_estado (
    id_hes    SERIAL PRIMARY KEY,
    fecha_reg TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descr     TEXT,
    causa     VARCHAR(50) NOT NULL,
 
    id_tipoe       INT NOT NULL REFERENCES tipo_estado(id_tipoe),
    id_act         INT NOT NULL REFERENCES activo_ti(id_act),
    id_usuario_reg INT REFERENCES usuario_sistema(id_usuario)   -- quién registró el cambio
    
);


--========================================================
--================== Asignacion ACT/EMP===================
--========================================================
--se elimina operatividad ya que con la fecha dev se identifica que el activo fue devuelto.

CREATE TABLE asignacion (
    id_asig        SERIAL PRIMARY KEY,
    fecha_entr     DATE NOT NULL,
    fecha_dev      DATE,        -- NULL = sigue asignado
                                -- con fecha = fue devuelto
    ruta_acta_entr VARCHAR(255),
 
    id_act         INT NOT NULL REFERENCES activo_ti(id_act),
    id_emp         INT NOT NULL REFERENCES empleado(id_emp), -- a quien se le asignó el equipo
    id_usuario_reg INT REFERENCES usuario_sistema(id_usuario)   -- quién procesó la asignación

);

--========================================================
--======================= CHECKLIST ======================
--========================================================
-- Plantillas tipadas (preparacion / reasignacion) para equipos de cómputo.
-- La ejecución checklist materializa una ejecución con snapshot de pasos.

CREATE TABLE plantilla (
    id_plantilla SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    proposito    VARCHAR(50)  NOT NULL CHECK (proposito IN ('Preparacion', 'Reasignacion')),
    vigente      BOOLEAN      NOT NULL DEFAULT TRUE  -- true = disponible para elegir al iniciar
);

CREATE TABLE plantilla_paso (
    id_paso      SERIAL PRIMARY KEY,
    id_plantilla INT  NOT NULL REFERENCES plantilla(id_plantilla) ON DELETE CASCADE,
    descr        TEXT NOT NULL,
    orden        INT  NOT NULL,
    activo       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE checklist (
    id_check     SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    fecha_ini    DATE,
    fecha_ter    DATE,
    proposito    VARCHAR(50) NOT NULL CHECK (proposito IN ('Preparacion', 'Reasignacion')),
    estado       VARCHAR(50) NOT NULL CHECK (estado IN ('Abierto', 'Cerrado', 'Cancelado')),
    id_usuario   INT REFERENCES usuario_sistema(id_usuario),
    id_act       INT NOT NULL REFERENCES activo_ti(id_act),
    id_asig      INT REFERENCES asignacion(id_asig),
    id_plantilla INT REFERENCES plantilla(id_plantilla)
);

-- Un solo checklist abierto por activo y propósito
CREATE UNIQUE INDEX uq_checklist_abierto_act_proposito
    ON checklist (id_act, proposito) WHERE estado = 'Abierto';

CREATE TABLE checklist_paso (
    id_cpaso    SERIAL PRIMARY KEY,
    id_check    INT  NOT NULL REFERENCES checklist(id_check) ON DELETE CASCADE,
    id_paso     INT  REFERENCES plantilla_paso(id_paso) ON DELETE SET NULL,
    orden       INT  NOT NULL,
    descr       TEXT NOT NULL,
    estado      VARCHAR(50) NOT NULL CHECK (estado IN ('Pendiente', 'Completado', 'No Aplica', 'En Proceso')),
    observacion VARCHAR(255)
);


--========================================================
--=================== SOLICITUD DE BAJA ===================
--========================================================
-- Flujo: el solicitante (usuario_sistema) crea la solicitud; 
-- la aprobación de jefatura ocurre por fuera del sistema (correo) 
--se deja constancia con ref_aprob/fecha_resolucion; el borrado seguro lo cierra un técnico.

CREATE TABLE solicitud_baja (
    id_solbaja          SERIAL PRIMARY KEY,
    motivo_baja         VARCHAR(200) NOT NULL,
    fecha_solicitud     DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_resolucion    DATE,
    ref_aprob           VARCHAR(200),           -- referencia del correo de aprobación 
    estado_sol          VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
                         CHECK (estado_sol IN ('Pendiente', 'Aprobada', 'Rechazada')),
    ruta_acta_baja      VARCHAR(255),           -- PDF acta de baja en Drive 
    fecha_borrado       DATE,                   -- formateo de datos

    id_act             INT NOT NULL REFERENCES activo_ti(id_act),
    id_usuario_sol     INT NOT NULL REFERENCES usuario_sistema(id_usuario), -- solicitante
    id_usuario_aprob   INT REFERENCES usuario_sistema(id_usuario),          -- jefatura aprobadora
    id_usuario_borrado INT REFERENCES usuario_sistema(id_usuario)           -- técnico responsable del formateo
);



-- ========================================================
-- =================== SEEDS CATÁLOGOS ====================
-- ========================================================
 
-- Empresas del holding
INSERT INTO empresa (nombre) VALUES
('Holding'),
('Comercializadora'),
('Paneles'),
('Servicios SPA');
 
-- Cargos
INSERT INTO cargo (nombre) VALUES
('Administrativo'),
('Informatico'),
('Analista'),
('Jefatura'),
('Tecnico');
 
-- Plantas
INSERT INTO planta (nombre) VALUES
('Batuco'),
('Paneles');
 
-- Tipos de equipo de cómputo
INSERT INTO tipo_equipo (nombre) VALUES
('Notebook'),
('Tablet'),
('Gabinete Slim'),
('Gabinete'),
('NUC');
 
-- Tipos de periférico conocidos hasta ahora
INSERT INTO tipo_periferico (nombre) VALUES
('Monitor'),
('Impresora');
 
-- Proveedores de licencia + sus versiones
INSERT INTO proveedor_licencia (nombre) VALUES
('Office'),    -- id 1
('Windows'),   -- id 2
('Sophos');    -- id 3
 
INSERT INTO version_licencia (id_prov, nombre) VALUES
(1, '2019'),
(1, '365'),
(2, 'Enterprise'),
(2, 'Server'),
(2, 'Home'),
(3, 'Intercept X');

INSERT INTO tipo_estado (nombre, descr) VALUES
('Bueno',   'Activo sin desperfectos fisicos ni internos'),
('Regular', 'Activo con detalles esteticos o de funcionamiento'),
('Malo',    'Activo con problemas de funcionamiento o piezas dañadas');

-- Disponibilidad
INSERT INTO disponibilidad (nombre, descr, color) VALUES
('Disponible', 'Activo libre para ser asignado',            'success'),
('Asignado',   'Activo actualmente asignado a un empleado', 'info'),
('Mantencion', 'Activo en proceso de mantencion',          'warning'),
('De Baja',    'Activo dado de baja del inventario',       'error');

-- Departamentos
INSERT INTO departamento (id_org, zona, nom_dpto) VALUES
(1, 'Administracion', 'Contabilidad'),
(1, 'Administracion', 'Tesoreria'),
(2, 'Administracion', 'TD'),
(2, 'Operaciones',    'Mantencion');

-- Sub areas
INSERT INTO sub_area (id_dpto, nombre) VALUES
(3, 'Soporte'),
(3, 'Desarrollo'),
(3, 'BI'),
(4, 'Electrica'),
(4, 'Mecanica');