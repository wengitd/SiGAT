-- ===================================
-- SiGAT 
-- Script de inicialización de BD
-- PostgreSQL 16
-- ===================================



--========================================================
--======================= FACTURA ========================
--========================================================

CREATE TABLE factura (
    id_fact         SERIAL PRIMARY KEY,
    prov_fact       VARCHAR(50) NOT NULL,
    fecha_em        DATE,
    num_folio       INT NOT NULL UNIQUE,
    ruta_pdf_fact   VARCHAR(200) NOT NULL
);


--========================================================
--=================== DEPARTAMENTO =======================
--========================================================
CREATE TABLE departamento (
    id_dpto         SERIAL PRIMARY KEY,
    empresa         VARCHAR(50) NOT NULL,
    zona            VARCHAR(50) ,
    subarea         VARCHAR(50),
    nom_dpto        VARCHAR(50)
);


--========================================================
--======================= LICENCIA =======================
--========================================================

CREATE TABLE licencia (
    id_lic          SERIAL PRIMARY KEY,
    fecha_ini       DATE, 
    fecha_exp       DATE,
    proveedor       VARCHAR(50) NOT NULL,
    ver_licen        VARCHAR(50) NOT NULL
);

--========================================================
--======================= EMPLEADO =======================
--========================================================

CREATE TABLE empleado (
    id_emp          SERIAL PRIMARY KEY,
    rut             VARCHAR(50) NOT NULL UNIQUE,
    nombre          VARCHAR(50) NOT NULL,
    email           VARCHAR(50) NOT NULL UNIQUE,
    cargo           VARCHAR(50) NOT NULL,
    planta          VARCHAR(50) NOT NULL,
    operatividad    BOOLEAN NOT NULL DEFAULT TRUE,

    id_dpto INT references departamento(id_dpto)
);

CREATE TABLE informatico (
    id_emp          INT PRIMARY KEY,
    hash_pass       VARCHAR(255) NOT NULL,
    rol             VARCHAR(50) NOT NULL,
    vigente         BOOLEAN NOT NULL DEFAULT TRUE,

    FOREIGN KEY (id_emp) references empleado (id_emp)

);

--========================================================
--======================= CHECKLIST ======================
--========================================================

CREATE TABLE checklist(
    id_check        SERIAL PRIMARY KEY,
    nombre          VARCHAR(50) NOT NULL,
    fecha_ini       DATE,
    fecha_ter       DATE,
    
    id_emp INT references informatico(id_emp)
);

CREATE TABLE plantilla (
    id_ip           SERIAL PRIMARY KEY,
    descr           TEXT,
    orden           INT NOT NULL
);

CREATE TABLE check_plantilla (
    id_check        INT NOT NULL, 
    id_ip           INT NOT NULL,
    estado          VARCHAR(50) NOT NULL,
    observacion     VARCHAR(255), 

    PRIMARY KEY (id_check, id_ip),
    FOREIGN KEY (id_check) references checklist(id_check),
    FOREIGN KEY (id_ip)    references plantilla(id_ip)
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
--============== Cambios de estado========================
--========================================================


CREATE TABLE tipo_estado (
    id_tipoe        SERIAL PRIMARY KEY,
    nombre          VARCHAR(50) NOT NULL UNIQUE,
    descr           TEXT,
    operatividad    BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO tipo_estado (nombre,descr) VALUES
('disponible',    'Activo listo para asignar un empleado'),
('en_preparacion','Activo en proceso de gestion por el técnico'),
('asignado',      'Activo entregado a empleado'),
('en_mantencion', 'Activo en revisión o reparación'),
('de baja',       'Activo retirado del Inventario');


--========================================================
--======================= ACTIVO_TI ======================
--========================================================

CREATE TABLE activo_ti (
    id_act          SERIAL PRIMARY KEY,
    modelo          VARCHAR(50) , 
    marca           VARCHAR(50) , 
    num_serie       VARCHAR(50) UNIQUE, 
    disponibilidad  BOOLEAN NOT NULL DEFAULT TRUE,
    tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('equipo_computo', 'periferico')), 
    origen          VARCHAR(20) NOT NULL CHECK (origen IN ('empresa', 'personal')),
    
    id_fact         INT references factura (id_fact) NOT NULL,
    id_tipoe        INT references tipo_estado (id_tipoe) NOT NULL      
);

CREATE TABLE equipo_computo (
    id_act          INT NOT NULL,
    ram_capac       INT,
    ram_tipo        VARCHAR(10) ,
    sist_op         VARCHAR(50) ,
    cpu             VARCHAR(50) ,
    mac_ethernet    VARCHAR(10) ,
    mac_wifi        VARCHAR(10) ,
    disco_un        VARCHAR(10) , --GB  MB
    disco_tipo      VARCHAR(20) , --ssd hdd
    disco_capac     INT, -- 500 250
    host_name       VARCHAR(50) ,
    tipo_equipo     VARCHAR(50) ,

    PRIMARY KEY (id_act),
    FOREIGN KEY (id_act) references activo_ti(id_act)

);

CREATE TABLE periferico (
    id_act          INT NOT NULL,
    tipo_per        VARCHAR(50) ,
    valor_tec       decimal,
    u_medida        VARCHAR(50) ,
    obs_perif       TEXT,

    PRIMARY KEY (id_act) ,
    FOREIGN KEY (id_act) references activo_ti(id_act)
);



CREATE TABLE historial_estado (
    id_hes          SERIAL PRIMARY KEY,
    fecha_reg       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descr           TEXT,
    causa           VARCHAR(50) NOT NULL,

    id_tipoe        INT references tipo_estado(id_tipoe) NOT NULL,
    id_act          INT references activo_ti(id_act) NOT NULL
);


--========================================================
--================== Asignacion ACT/EMP===================
--========================================================

CREATE TABLE asignacion (
    id_asig             SERIAL PRIMARY KEY,
    fecha_entr          DATE NOT NULL,
    fecha_dev           DATE, 
    ruta_acta_entr      VARCHAR(255),
    operatividad        BOOLEAN NOT NULL DEFAULT TRUE,

    id_act INT references activo_ti(id_act) NOT NULL,
    id_emp INT references empleado (id_emp) NOT NULL   
);


