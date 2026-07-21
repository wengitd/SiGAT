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
 
CREATE TABLE proveedor_factura (
    id_prov_fact SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL UNIQUE
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
    id_emp    INT PRIMARY KEY,
    hash_pass VARCHAR(255) NOT NULL,
    rol       VARCHAR(20)  NOT NULL CHECK (rol IN ('editor', 'auditor', 'admin')),
    vigente   BOOLEAN NOT NULL DEFAULT TRUE,

    FOREIGN KEY (id_emp) REFERENCES empleado(id_emp)
);

--========================================================
--======================= CHECKLIST ======================
--========================================================

CREATE TABLE checklist(
    id_check        SERIAL PRIMARY KEY,
    nombre          VARCHAR(50) NOT NULL,
    fecha_ini       DATE,
    fecha_ter       DATE,
    
    id_emp INT references usuario_sistema(id_emp)
);

CREATE TABLE plantilla (
    id_ip           SERIAL PRIMARY KEY,
    descr           TEXT,
    orden           INT NOT NULL
);

CREATE TABLE check_plantilla (
    id_check        INT NOT NULL, 
    id_ip           INT NOT NULL,
    estado          VARCHAR(50) NOT NULL CHECK (estado IN ('pendiente', 'completado', 'no_aplica', 'en_proceso')),
    observacion     VARCHAR(255), 

    PRIMARY KEY (id_check, id_ip),
    FOREIGN KEY (id_check) references checklist(id_check),
    FOREIGN KEY (id_ip)    references plantilla(id_ip)
);

--========================================================
--======================= LICENCIA =======================
--========================================================
-- fecha_ini y fecha_exp pertenecen a licencia:
-- son fechas del contrato específico, no del catálogo.

CREATE TABLE licencia (
    id_lic          SERIAL PRIMARY KEY,
    fecha_ini       DATE, 
    fecha_exp       DATE,
    
    id_prov   INT NOT NULL REFERENCES proveedor_licencia(id_prov),
    id_ver    INT NOT NULL REFERENCES version_licencia(id_ver)
);

--========================================================
--==================== EMPLEADO/LICENCIA =================
--========================================================

CREATE TABLE emp_lic (
    id_emp          INT NOT NULL,
    id_lic          INT NOT NULL,

    PRIMARY KEY (id_emp, id_lic),
    FOREIGN KEY (id_emp) references empleado(id_emp),
    FOREIGN KEY (id_lic) references licencia(id_lic)
);

--========================================================
--============== TIPO ESTADO      ========================
--========================================================


CREATE TABLE tipo_estado (
    id_tipoe        SERIAL PRIMARY KEY,
    nombre          VARCHAR(50) NOT NULL UNIQUE,
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
    modelo         VARCHAR(50),
    marca          VARCHAR(50),
    num_serie      VARCHAR(50) UNIQUE,
    tipo           VARCHAR(20) NOT NULL CHECK (tipo   IN ('equipo_computo', 'periferico')),
    origen         VARCHAR(20) NOT NULL CHECK (origen IN ('empresa', 'personal')),
    fecha_recep    DATE,
 
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



CREATE TABLE historial_estado (
    id_hes    SERIAL PRIMARY KEY,
    fecha_reg TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descr     TEXT,
    causa     VARCHAR(50) NOT NULL,
 
    id_tipoe    INT NOT NULL REFERENCES tipo_estado(id_tipoe),
    id_act      INT NOT NULL REFERENCES activo_ti(id_act),
    id_emp_reg  INT REFERENCES usuario_sistema(id_emp)   -- quién registró el cambio
    
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
 
    id_act      INT NOT NULL REFERENCES activo_ti(id_act),
    id_emp      INT NOT NULL REFERENCES empleado(id_emp), -- a quien se le asignó el equipo
    id_emp_reg  INT REFERENCES usuario_sistema(id_emp)   -- quién procesó la asignación

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

INSERT INTO tipo_estado (nombre,descr) VALUES
('Bueno',   'Activo sin desperfectos fisicos ni internos'),
('Regular', 'Activo con detalles esteticos o de funcionamiento'),
('Malo',    'Activo con problemas de funcionamiento o piezas dañadas');

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

-- Empleados
INSERT INTO empleado (rut, nombre, email, id_cargo, id_planta, id_dpto, id_sub) VALUES
('12345678-9', 'Juan Pérez',  'juan@empresa.cl',  1, 1, 1, NULL),
('98765432-1', 'Ana García',  'ana@empresa.cl',   2, 1, 3, 1);

-- Usuario del sistema (el empleado ya debe existir)
INSERT INTO usuario_sistema (id_emp, hash_pass, rol, vigente) VALUES
(2, 'hash_temporal', 'editor', TRUE);