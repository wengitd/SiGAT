-- ===================================
-- SiGAT 
-- Script de inicialización de BD
-- PostgreSQL 16
-- v2- Tablas catálogos + CHECK constrains
-- Se modifica para facilitar en el frontend ciertos requsitos.
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
    id_marca    SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    tipo_activo VARCHAR(20)  NOT NULL CHECK (tipo_activo IN ('equipo_computo', 'periferico')),
    UNIQUE (nombre, tipo_activo)
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
 
CREATE TABLE proveedor_factura (
    id_prov_fact SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE disponibilidad (
    id_dispo    SERIAL PRIMARY KEY,
    nombre      VARCHAR (100) NOT NULL UNIQUE
                CHECK (nombre IN ('disponible', 'asignado', 'mantencion', 'de_baja')),
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
    num_folio     INT  NOT NULL UNIQUE,
    ruta_pdf_fact VARCHAR(200) NOT NULL,
    
    id_prov_fact  INT  NOT NULL REFERENCES proveedor_factura(id_prov_fact)
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
    rol        VARCHAR(20)  NOT NULL CHECK (rol IN ('editor', 'auditor', 'admin')),
    vigente    BOOLEAN NOT NULL DEFAULT TRUE
);

--========================================================
--======================= LICENCIA =======================
--========================================================
-- Contrato = proveedor + versión. La fecha de asignación
-- vive en emp_lic (fecha_asignacion), no en el contrato.

CREATE TABLE licencia (
    id_lic          SERIAL PRIMARY KEY,
    id_prov   INT NOT NULL REFERENCES proveedor_licencia(id_prov),
    id_ver    INT NOT NULL REFERENCES version_licencia(id_ver)
);

--========================================================
--==================== EMPLEADO/LICENCIA =================
--========================================================

CREATE TABLE emp_lic (
    id_emp            INT NOT NULL,
    id_lic            INT NOT NULL,
    fecha_asignacion  DATE NOT NULL,

    PRIMARY KEY (id_emp, id_lic),
    FOREIGN KEY (id_emp) references empleado(id_emp),
    FOREIGN KEY (id_lic) references licencia(id_lic)
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
    tipo           VARCHAR(20) NOT NULL CHECK (tipo   IN ('equipo_computo', 'periferico')),
    origen         VARCHAR(20) NOT NULL CHECK (origen IN ('empresa', 'personal')),
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
    proposito    VARCHAR(50)  NOT NULL CHECK (proposito IN ('preparacion', 'reasignacion')),
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
    proposito    VARCHAR(50) NOT NULL CHECK (proposito IN ('preparacion', 'reasignacion')),
    estado       VARCHAR(50) NOT NULL CHECK (estado IN ('abierto', 'cerrado', 'cancelado')),
    id_usuario   INT REFERENCES usuario_sistema(id_usuario),
    id_act       INT NOT NULL REFERENCES activo_ti(id_act),
    id_asig      INT REFERENCES asignacion(id_asig),
    id_plantilla INT REFERENCES plantilla(id_plantilla)
);

-- Un solo checklist abierto por activo y propósito
CREATE UNIQUE INDEX uq_checklist_abierto_act_proposito
    ON checklist (id_act, proposito) WHERE estado = 'abierto';

CREATE TABLE checklist_paso (
    id_cpaso    SERIAL PRIMARY KEY,
    id_check    INT  NOT NULL REFERENCES checklist(id_check) ON DELETE CASCADE,
    id_paso     INT  REFERENCES plantilla_paso(id_paso) ON DELETE SET NULL,
    orden       INT  NOT NULL,
    descr       TEXT NOT NULL,
    estado      VARCHAR(50) NOT NULL CHECK (estado IN ('pendiente', 'completado', 'no_aplica', 'en_proceso')),
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
    estado_sol          VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                         CHECK (estado_sol IN ('pendiente', 'aprobada', 'rechazada')),
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
('disponible', 'Activo libre para ser asignado',            'success'),
('asignado',   'Activo actualmente asignado a un empleado', 'info'),
('mantencion', 'Activo en proceso de mantencion',          'warning'),
('de_baja',    'Activo dado de baja del inventario',       'error');

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

-- Empleados base
INSERT INTO empleado (rut, nombre, email, id_cargo, id_planta, id_dpto, id_sub) VALUES
('12345678-9', 'Juan Pérez',  'juan@empresa.cl',  1, 1, 1, NULL),
('98765432-1', 'Ana García',  'ana@empresa.cl',   2, 1, 3, 1);

-- Usuarios del sistema base
INSERT INTO usuario_sistema (nombre, email, hash_pass, rol, vigente) VALUES
('Administrador', 'admin@empresa.cl', '$argon2id$v=19$m=65536,t=3,p=4$lS1k4c+6X6q5n0b0WJ9vXw$S7U2n/3d3d+U5m5n3n3n3n3n3n3n3n3n3n3n3n3n3n3', 'admin', TRUE),
('Ana García (Editor)', 'ana@empresa.cl', '$argon2id$v=19$m=65536,t=3,p=4$lS1k4c+6X6q5n0b0WJ9vXw$S7U2n/3d3d+U5m5n3n3n3n3n3n3n3n3n3n3n3n3n3', 'editor', TRUE);


-- ============================================================================
-- ==================== SECCIÓN DE DESARROLLADOR / PRUEBAS =====================
-- ============================================================================
-- ATENCIÓN: El siguiente bloque contiene DATOS DE PRUEBA (mock data) basados
-- en marcas, modelos y activos de TI reales (Dell, HP, Lenovo, Apple, etc.)
-- para uso exclusivo en entornos de DESARROLLO / TEST.
-- 
-- PARA AMBIENTES DE PRODUCCIÓN:
-- Eliminar o comentar todo el contenido a partir de esta línea.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MARCAS Y MODELOS REALES
-- ----------------------------------------------------------------------------
INSERT INTO marca (nombre, tipo_activo) VALUES
('Dell', 'equipo_computo'),      -- id 1
('HP', 'equipo_computo'),        -- id 2
('Lenovo', 'equipo_computo'),    -- id 3
('Apple', 'equipo_computo'),     -- id 4
('Samsung', 'equipo_computo'),   -- id 5
('LG', 'periferico'),            -- id 6
('Epson', 'periferico'),         -- id 7
('Logitech', 'periferico'),      -- id 8
('Dell', 'periferico'),          -- id 9  (monitores Dell)
('HP', 'periferico'),            -- id 10 (impresoras HP)
('Lenovo', 'periferico'),        -- id 11 (monitores Lenovo)
('Samsung', 'periferico');       -- id 12 (monitores Samsung)

INSERT INTO modelo (id_marca, nombre) VALUES
-- Dell (id_marca 1 - equipo_computo)
(1, 'Latitude 3420'),       -- id 1
(1, 'Latitude 5430'),       -- id 2
(1, 'OptiPlex 3080 Slim'),  -- id 3
-- Dell (id_marca 9 - periferico)
(9, 'UltraSharp U2723QE'),  -- id 4
-- HP (id_marca 2 - equipo_computo)
(2, 'ProBook 440 G8'),      -- id 5
(2, 'EliteBook 840 G9'),    -- id 6
-- HP (id_marca 10 - periferico)
(10, 'LaserJet Pro M404dn'), -- id 7
-- Lenovo (id_marca 3 - equipo_computo)
(3, 'ThinkPad T14 Gen 2'),  -- id 8
(3, 'ThinkCentre M70q'),    -- id 9
-- Lenovo (id_marca 11 - periferico)
(11, 'ThinkVision S24e-20'), -- id 10
-- Apple (id_marca 4 - equipo_computo)
(4, 'MacBook Pro 14 M2'),   -- id 11
(4, 'MacBook Air 13 M1'),   -- id 12
-- Samsung (id_marca 12 - periferico)
(12, 'S24F350 Monitor'),    -- id 13
-- Samsung (id_marca 5 - equipo_computo)
(5, 'Galaxy Tab S8'),       -- id 14
-- LG (id_marca 6 - periferico)
(6, '24MK600M'),            -- id 15
-- Epson (id_marca 7 - periferico)
(7, 'EcoTank L3250'),       -- id 16
-- Logitech (id_marca 8 - periferico)
(8, 'MK270 Wireless');      -- id 17

-- ----------------------------------------------------------------------------
-- 2. SISTEMAS OPERATIVOS (FAMILIA, VERSIÓN, EDICIÓN)
-- ----------------------------------------------------------------------------
INSERT INTO familia_so (nombre) VALUES
('Windows'), -- id 1
('Linux'),   -- id 2
('macOS');   -- id 3

INSERT INTO version_so (id_fam_so, nombre) VALUES
(1, '11'),                     -- id 1
(1, '10'),                     -- id 2
(1, 'Server 2022'),            -- id 3
(2, 'Ubuntu 22.04 LTS'),       -- id 4
(2, 'Red Hat Enterprise 9'),   -- id 5
(3, 'Sonoma 14');              -- id 6

INSERT INTO edicion_so (id_ver_so, nombre) VALUES
(1, 'Pro 64-bit'),          -- id 1 (Win 11)
(1, 'Home 64-bit'),         -- id 2 (Win 11)
(1, 'Enterprise 64-bit'),   -- id 3 (Win 11)
(2, 'Pro 64-bit'),          -- id 4 (Win 10)
(2, 'Enterprise 64-bit'),   -- id 5 (Win 10)
(3, 'Standard Edition'),    -- id 6 (Win Server 2022)
(4, 'Desktop'),             -- id 7 (Ubuntu 22.04)
(4, 'Server'),              -- id 8 (Ubuntu 22.04)
(6, 'Standard');            -- id 9 (macOS Sonoma)

-- ----------------------------------------------------------------------------
-- 3. PROVEEDORES DE FACTURA Y FACTURAS
-- ----------------------------------------------------------------------------
INSERT INTO proveedor_factura (nombre) VALUES
('Ingram Micro Chile SpA'), -- id 1
('TechMarket Chile SpA'),   -- id 2
('PC Factory S.A.'),        -- id 3
('Sintac Chile');           -- id 4

INSERT INTO factura (fecha_em, num_folio, ruta_pdf_fact, id_prov_fact) VALUES
('2024-01-15', 10452, '/facturas/2024/F10452_Ingram.pdf', 1),     -- id 1
('2024-03-20', 88201, '/facturas/2024/F88201_TechMarket.pdf', 2), -- id 2
('2024-05-10', 55412, '/facturas/2024/F55412_PCFactory.pdf', 3);  -- id 3

-- ----------------------------------------------------------------------------
-- 4. MATRIZ DE ESTADO Y DISPONIBILIDAD (ESTADO_DISPO)
-- ----------------------------------------------------------------------------
INSERT INTO estado_dispo (id_tipoe, id_dispo) VALUES
(1, 1), -- Bueno - disponible
(1, 2), -- Bueno - asignado
(2, 1), -- Regular - disponible
(2, 2), -- Regular - asignado
(2, 3), -- Regular - mantencion
(3, 3), -- Malo - mantencion
(3, 4); -- Malo - de_baja

-- ----------------------------------------------------------------------------
-- 5. EMPLEADOS ADICIONALES DE PRUEBA
-- ----------------------------------------------------------------------------
INSERT INTO empleado (rut, nombre, email, id_cargo, id_planta, id_dpto, id_sub) VALUES
('15678901-2', 'Carlos Mendoza',    'carlos.mendoza@empresa.cl', 3, 1, 2, NULL), -- id 3
('16789012-3', 'María José Rojas',  'maria.rojas@empresa.cl',    4, 2, 3, 2),    -- id 4
('17890123-4', 'Roberto Gómez',     'roberto.gomez@empresa.cl',   5, 1, 4, 4);    -- id 5

-- ----------------------------------------------------------------------------
-- 6. LICENCIAS CONTRATADAS Y ASIGNACIONES DE LICENCIA
-- ----------------------------------------------------------------------------
INSERT INTO licencia (id_prov, id_ver) VALUES
(1, 2), -- id 1: Office 365
(2, 3), -- id 2: Windows Enterprise
(3, 6); -- id 3: Sophos Intercept X

INSERT INTO emp_lic (id_emp, id_lic, fecha_asignacion) VALUES
(1, 1, '2024-03-01'),
(2, 1, '2024-03-15'),
(2, 3, '2024-04-01'),
(3, 1, '2024-05-10'),
(4, 1, '2024-06-01'),
(4, 2, '2024-06-01'),
(4, 3, '2024-06-15');

-- ----------------------------------------------------------------------------
-- 7. ACTIVOS TI (EQUIPOS DE CÓMPUTO Y PERIFÉRICOS)
-- ----------------------------------------------------------------------------
-- Activos principales
INSERT INTO activo_ti (num_serie, tipo, origen, fecha_recep, id_modelo, id_fact, id_tipoe, id_dispo) VALUES
('DEL-5430-88A1',   'equipo_computo', 'empresa', '2024-01-20', 2,  1, 1, 2), -- id 1 (Dell Latitude 5430 - Bueno / Asignado)
('LEN-T14-99B2',    'equipo_computo', 'empresa', '2024-02-15', 8,  2, 1, 2), -- id 2 (ThinkPad T14 - Bueno / Asignado)
('C02GX0AAQ05D',    'equipo_computo', 'empresa', '2024-03-01', 11, 2, 1, 2), -- id 3 (MacBook Pro 14 - Bueno / Asignado)
('DEL-OPT-3080-X1', 'equipo_computo', 'empresa', '2023-11-10', 3,  1, 1, 1), -- id 4 (OptiPlex 3080 - Bueno / Disponible)
('R52R30ABCDX',     'equipo_computo', 'empresa', '2024-04-05', 14, 3, 1, 1), -- id 5 (Galaxy Tab S8 - Bueno / Disponible)
('5CD1234567',      'equipo_computo', 'empresa', '2022-05-12', 5,  1, 3, 4), -- id 6 (HP ProBook 440 - Malo / De baja)
('CN-0U2723-1234',  'periferico',     'empresa', '2024-01-20', 4,  1, 1, 2), -- id 7 (Monitor Dell UltraSharp - Bueno / Asignado)
('PHB1234567',      'periferico',     'empresa', '2023-08-15', 7,  3, 2, 3), -- id 8 (Impresora HP LaserJet - Regular / Mantencion)
('VK12345678',      'periferico',     'empresa', '2024-02-15', 10, 2, 1, 1); -- id 9 (Monitor ThinkVision 24 - Bueno / Disponible)

-- Detalle Equipos de Cómputo
INSERT INTO equipo_computo 
(id_act, ram_capac, ram_tipo, cpu, mac_ethernet, mac_wifi, disco_capac, disco_tipo, disco_unidad, host_name, id_tipoeq, id_edicion_so) VALUES
(1, 16, 'DDR4',   'Intel Core i5-1245U',   '00:1A:2B:3C:4D:5E', '00:1A:2B:3C:4D:5F', 512, 'NVMe', 'GB', 'NB-TD-001',   1, 1),
(2, 32, 'DDR4',   'AMD Ryzen 7 PRO 5850U', '00:11:22:33:44:55', '00:11:22:33:44:56', 1,   'NVMe', 'TB', 'NB-DES-002',  1, 1),
(3, 16, 'LPDDR5', 'Apple M2 Pro',          NULL,                'A4:83:E7:12:34:56', 512, 'SSD',  'GB', 'MAC-DEV-001', 1, 9),
(4, 8,  'DDR4',   'Intel Core i3-10100',   '70:8B:CD:9E:11:22', NULL,                256, 'SSD',  'GB', 'PC-CONT-001', 3, 4),
(5, 8,  'LPDDR5', 'Snapdragon 8 Gen 1',    NULL,                'CC:DD:EE:FF:11:22', 128, 'eMMC', 'GB', 'TAB-OP-001',  2, NULL),
(6, 8,  'DDR4',   'Intel Core i5-1135G7',  'A0:B1:C2:D3:E4:F5', 'A0:B1:C2:D3:E4:F6', 256, 'SSD',  'GB', 'NB-OLD-099',  1, 4);

-- Detalle Periféricos
INSERT INTO periferico (id_act, valor_tec, u_medida, obs_perif, id_tipoper) VALUES
(7, 450.00, 'USD', 'Monitor 4K IPS USB-C Hub', 1),
(8, 280.00, 'USD', 'Requiere cambio de kit de arrastre de papel', 2),
(9, 140.00, 'USD', 'Monitor FHD HDMI/VGA', 1);

-- ----------------------------------------------------------------------------
-- 8. ASIGNACIONES DE ACTIVOS A EMPLEADOS
-- ----------------------------------------------------------------------------
INSERT INTO asignacion (fecha_entr, fecha_dev, ruta_acta_entr, id_act, id_emp, id_usuario_reg) VALUES
('2024-01-22', NULL,         '/actas/ACTA-001-DEL5430.pdf', 1, 1, 1), -- Dell 5430 a Juan Pérez
('2024-02-16', NULL,         '/actas/ACTA-002-LENT14.pdf',  2, 2, 1), -- ThinkPad a Ana García
('2024-03-05', NULL,         '/actas/ACTA-003-MAC14.pdf',   3, 4, 1), -- MacBook Pro a María José Rojas
('2024-01-22', NULL,         '/actas/ACTA-001-DEL5430.pdf', 7, 1, 1), -- Monitor UltraSharp a Juan Pérez
('2022-05-15', '2024-01-10', '/actas/ACTA-HIST-HP440.pdf',  6, 3, 1); -- HP 440 asignado a Carlos y devuelto

-- ----------------------------------------------------------------------------
-- 9. HISTORIAL DE ESTADO DE ACTIVOS
-- ----------------------------------------------------------------------------
INSERT INTO historial_estado (fecha_reg, descr, causa, id_tipoe, id_act, id_usuario_reg) VALUES
('2024-01-20 10:00:00', 'Ingreso inicial a inventario en perfecto estado', 'Recepcion Factura', 1, 1, 1),
('2024-01-10 14:30:00', 'Falla en tarjeta madre por alza de voltaje',        'Falla Hardware',    3, 6, 1),
('2024-06-12 11:15:00', 'Atasco constante de papel en bandeja 2',           'Mantencion',        2, 8, 2);

-- ----------------------------------------------------------------------------
-- 10. SOLICITUDES DE BAJA
-- ----------------------------------------------------------------------------
INSERT INTO solicitud_baja 
(motivo_baja, fecha_solicitud, fecha_resolucion, ref_aprob, estado_sol, ruta_acta_baja, fecha_borrado, id_act, id_usuario_sol, id_usuario_aprob, id_usuario_borrado) VALUES
('Falla irrecuperable en placa madre por alza de voltaje', '2024-01-12', '2024-01-15', 'CORREO-APROB-BAJA-044', 'aprobada', '/actas_baja/BAJA-ACT-006.pdf', '2024-01-16', 6, 2, 1, 1);

-- ----------------------------------------------------------------------------
-- 11. PLANTILLAS Y CHECKLISTS DE TÉCNICO (solo equipos de cómputo)
-- ----------------------------------------------------------------------------
INSERT INTO plantilla (nombre, proposito, vigente) VALUES
('Preparación estándar de equipo', 'preparacion', TRUE),          -- id 1
('Reasignación estándar de equipo', 'reasignacion', TRUE),        -- id 2
('Preparación rápida (equipo nuevo)', 'preparacion', TRUE),       -- id 3
('Reasignación con formateo', 'reasignacion', TRUE);              -- id 4

INSERT INTO plantilla_paso (id_plantilla, descr, orden, activo) VALUES
-- Plantilla 1: preparación estándar (id_paso 1..7)
(1, 'Verificación visual de pantalla, teclado y carcasa', 1, TRUE),
(1, 'Prueba de encendido y test de memoria RAM', 2, TRUE),
(1, 'Limpieza física interna y cambio de pasta térmica', 3, TRUE),
(1, 'Formateo seguro de almacenamiento e instalación de SO base', 4, TRUE),
(1, 'Instalación y actualización de software corporativo y antivirus', 5, TRUE),
(1, 'Configuración de licencias y cuenta de usuario', 6, TRUE),
(1, 'Configuración de hostname y red corporativa', 7, TRUE),
-- Plantilla 2: reasignación estándar (id_paso 8..12)
(2, 'Respaldo o entrega de datos del usuario saliente', 1, TRUE),
(2, 'Borrado seguro / perfil limpio del usuario anterior', 2, TRUE),
(2, 'Reinstalación de aplicaciones según cargo del nuevo usuario', 3, TRUE),
(2, 'Asignación de cuentas y licencias del nuevo usuario', 4, TRUE),
(2, 'Prueba de entrega y verificación operativa', 5, TRUE),
-- Plantilla 3: preparación rápida (id_paso 13..16)
(3, 'Verificación visual rápida', 1, TRUE),
(3, 'Formateo e instalación de SO base', 2, TRUE),
(3, 'Software corporativo y antivirus', 3, TRUE),
(3, 'Hostname, red y cuenta de usuario', 4, TRUE),
-- Plantilla 4: reasignación con formateo (id_paso 17..22)
(4, 'Respaldo o entrega de datos del usuario saliente', 1, TRUE),
(4, 'Formateo seguro e instalación de SO base', 2, TRUE),
(4, 'Borrado / perfil limpio del usuario anterior', 3, TRUE),
(4, 'Reinstalación de aplicaciones según cargo', 4, TRUE),
(4, 'Cuentas y licencias del nuevo usuario', 5, TRUE),
(4, 'Prueba de entrega y verificación operativa', 6, TRUE);

-- Escenarios de prueba (solo equipo_computo):
--   Act1 asignado: prep cerrada, sin reasig        → no reasignable
--   Act2 asignado: prep + reasig cerradas          → listo para reasignar
--   Act3 asignado: prep cerrada + reasig abierta   → reasignación en curso
--   Act4 disponible: prep cerrada                  → listo para asignar
--   Act5 disponible: prep cancelada + abierta      → preparación en curso
--   Act6 de baja: prep histórica cerrada           → trazabilidad

INSERT INTO checklist (nombre, fecha_ini, fecha_ter, proposito, estado, id_usuario, id_act, id_asig, id_plantilla) VALUES
-- 1: Dell Latitude 5430 (NB-TD-001) — prep previa a asignación 2024-01-22
('Preparación ingreso NB-TD-001',  '2024-01-20', '2024-01-21', 'preparacion', 'cerrado',   1, 1, NULL, 1),
-- 2: ThinkPad T14 (NB-DES-002) — prep previa a asignación 2024-02-16
('Preparación ingreso NB-DES-002', '2024-02-14', '2024-02-15', 'preparacion', 'cerrado',   1, 2, NULL, 1),
-- 3: MacBook Pro (MAC-DEV-001) — prep rápida
('Preparación ingreso MAC-DEV-001','2024-03-02', '2024-03-04', 'preparacion', 'cerrado',   1, 3, NULL, 3),
-- 4: OptiPlex 3080 (PC-CONT-001) — disponible listo para asignar
('Preparación ingreso PC-CONT-001','2024-05-10', '2024-05-11', 'preparacion', 'cerrado',   2, 4, NULL, 1),
-- 5: Galaxy Tab S8 — intento cancelado
('Preparación abortada TAB-OP-001','2024-06-01', '2024-06-01', 'preparacion', 'cancelado', 2, 5, NULL, 3),
-- 6: Galaxy Tab S8 — preparación en curso (no asignable)
('Preparación en curso TAB-OP-001','2024-06-05', NULL,         'preparacion', 'abierto',   2, 5, NULL, 1),
-- 7: HP ProBook (NB-OLD-099) — prep histórica antes de asignación 2022-05-15
('Preparación ingreso NB-OLD-099', '2022-05-12', '2022-05-14', 'preparacion', 'cerrado',   1, 6, NULL, 1),
-- 8: ThinkPad — reasignación cerrada vinculada a asignación vigente id_asig=2
('Reasignación NB-DES-002',        '2024-07-01', '2024-07-02', 'reasignacion','cerrado',   1, 2, 2, 2),
-- 9: MacBook — reasignación con formateo abierta (id_asig=3)
('Reasignación MAC-DEV-001',       '2024-07-10', NULL,         'reasignacion','abierto',   1, 3, 3, 4);

-- Pasos preparación (plantilla id_paso 1..7)
INSERT INTO checklist_paso (id_check, id_paso, orden, descr, estado, observacion) VALUES
-- Check 1 (act1) cerrado
(1, 1, 1, 'Verificación visual de pantalla, teclado y carcasa', 'completado', 'Pantalla y chasis en perfecto estado'),
(1, 2, 2, 'Prueba de encendido y test de memoria RAM', 'completado', 'RAM OK sin errores MemTest'),
(1, 3, 3, 'Limpieza física interna y cambio de pasta térmica', 'no_aplica', 'Equipo nuevo de paquete'),
(1, 4, 4, 'Formateo seguro de almacenamiento e instalación de SO base', 'completado', 'Instalado Windows 11 Pro'),
(1, 5, 5, 'Instalación y actualización de software corporativo y antivirus', 'completado', 'Antivirus Sophos instalado'),
(1, 6, 6, 'Configuración de licencias y cuenta de usuario', 'completado', NULL),
(1, 7, 7, 'Configuración de hostname y red corporativa', 'completado', 'Host NB-TD-001'),
-- Check 2 (act2) cerrado
(2, 1, 1, 'Verificación visual de pantalla, teclado y carcasa', 'completado', NULL),
(2, 2, 2, 'Prueba de encendido y test de memoria RAM', 'completado', 'MemTest OK'),
(2, 3, 3, 'Limpieza física interna y cambio de pasta térmica', 'completado', 'Limpieza y pasta térmica renovada'),
(2, 4, 4, 'Formateo seguro de almacenamiento e instalación de SO base', 'completado', 'Windows 11 Pro'),
(2, 5, 5, 'Instalación y actualización de software corporativo y antivirus', 'completado', NULL),
(2, 6, 6, 'Configuración de licencias y cuenta de usuario', 'completado', 'Office + Sophos'),
(2, 7, 7, 'Configuración de hostname y red corporativa', 'completado', 'Host NB-DES-002'),
-- Check 3 (act3) cerrado — plantilla rápida (id_paso 13..16)
(3, 13, 1, 'Verificación visual rápida', 'completado', 'Carcasa sin daños'),
(3, 14, 2, 'Formateo e instalación de SO base', 'completado', 'macOS Ventura'),
(3, 15, 3, 'Software corporativo y antivirus', 'completado', NULL),
(3, 16, 4, 'Hostname, red y cuenta de usuario', 'completado', 'Host MAC-DEV-001'),
-- Check 4 (act4) cerrado — listo para asignar
(4, 1, 1, 'Verificación visual de pantalla, teclado y carcasa', 'completado', NULL),
(4, 2, 2, 'Prueba de encendido y test de memoria RAM', 'completado', 'RAM 8GB OK'),
(4, 3, 3, 'Limpieza física interna y cambio de pasta térmica', 'completado', NULL),
(4, 4, 4, 'Formateo seguro de almacenamiento e instalación de SO base', 'completado', 'Windows 10 Pro'),
(4, 5, 5, 'Instalación y actualización de software corporativo y antivirus', 'completado', NULL),
(4, 6, 6, 'Configuración de licencias y cuenta de usuario', 'completado', 'Cuenta genérica de preparación'),
(4, 7, 7, 'Configuración de hostname y red corporativa', 'completado', 'Host PC-CONT-001'),
-- Check 5 (act5) cancelado — plantilla rápida (id_paso 13..16)
(5, 13, 1, 'Verificación visual rápida', 'completado', 'Pantalla OK'),
(5, 14, 2, 'Formateo e instalación de SO base', 'en_proceso', 'Interrumpido por falta de cargador'),
(5, 15, 3, 'Software corporativo y antivirus', 'pendiente', NULL),
(5, 16, 4, 'Hostname, red y cuenta de usuario', 'pendiente', NULL),
-- Check 6 (act5) abierto — preparación en curso
(6, 1, 1, 'Verificación visual de pantalla, teclado y carcasa', 'completado', NULL),
(6, 2, 2, 'Prueba de encendido y test de memoria RAM', 'completado', 'OK'),
(6, 3, 3, 'Limpieza física interna y cambio de pasta térmica', 'no_aplica', 'Tablet sin mantenimiento interno'),
(6, 4, 4, 'Formateo seguro de almacenamiento e instalación de SO base', 'en_proceso', 'Restableciendo Android'),
(6, 5, 5, 'Instalación y actualización de software corporativo y antivirus', 'pendiente', NULL),
(6, 6, 6, 'Configuración de licencias y cuenta de usuario', 'pendiente', NULL),
(6, 7, 7, 'Configuración de hostname y red corporativa', 'pendiente', NULL),
-- Check 7 (act6) cerrado histórico
(7, 1, 1, 'Verificación visual de pantalla, teclado y carcasa', 'completado', 'Desgaste leve en carcasa'),
(7, 2, 2, 'Prueba de encendido y test de memoria RAM', 'completado', NULL),
(7, 3, 3, 'Limpieza física interna y cambio de pasta térmica', 'completado', NULL),
(7, 4, 4, 'Formateo seguro de almacenamiento e instalación de SO base', 'completado', 'Windows 10 Pro'),
(7, 5, 5, 'Instalación y actualización de software corporativo y antivirus', 'completado', NULL),
(7, 6, 6, 'Configuración de licencias y cuenta de usuario', 'completado', NULL),
(7, 7, 7, 'Configuración de hostname y red corporativa', 'completado', 'Host NB-OLD-099');

-- Pasos reasignación
INSERT INTO checklist_paso (id_check, id_paso, orden, descr, estado, observacion) VALUES
-- Check 8 (act2) reasignación estándar cerrada (id_paso 8..12)
(8, 8,  1, 'Respaldo o entrega de datos del usuario saliente', 'completado', 'Datos entregados a Ana García'),
(8, 9,  2, 'Borrado seguro / perfil limpio del usuario anterior', 'completado', 'Perfil local eliminado'),
(8, 10, 3, 'Reinstalación de aplicaciones según cargo del nuevo usuario', 'completado', NULL),
(8, 11, 4, 'Asignación de cuentas y licencias del nuevo usuario', 'completado', 'Cuentas pendientes de confirmar en AD'),
(8, 12, 5, 'Prueba de entrega y verificación operativa', 'completado', 'Equipo operativo'),
-- Check 9 (act3) reasignación con formateo abierta (id_paso 17..22)
(9, 17, 1, 'Respaldo o entrega de datos del usuario saliente', 'completado', 'Respaldo en OneDrive corporativo'),
(9, 18, 2, 'Formateo seguro e instalación de SO base', 'en_proceso', 'Formateo en progreso'),
(9, 19, 3, 'Borrado / perfil limpio del usuario anterior', 'pendiente', NULL),
(9, 20, 4, 'Reinstalación de aplicaciones según cargo', 'pendiente', NULL),
(9, 21, 5, 'Cuentas y licencias del nuevo usuario', 'pendiente', NULL),
(9, 22, 6, 'Prueba de entrega y verificación operativa', 'pendiente', NULL);
