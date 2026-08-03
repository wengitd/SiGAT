-- Migración: reestructura plantilla/checklist para preparación y reasignación.
-- ADVERTENCIA: elimina datos previos de checklist/plantilla/check_plantilla.

BEGIN;

DROP TABLE IF EXISTS check_plantilla CASCADE;
DROP TABLE IF EXISTS checklist CASCADE;
DROP TABLE IF EXISTS plantilla CASCADE;

CREATE TABLE plantilla (
    id_plantilla SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    proposito    VARCHAR(50)  NOT NULL CHECK (proposito IN ('preparacion', 'reasignacion')),
    vigente      BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX uq_plantilla_vigente_proposito
    ON plantilla (proposito) WHERE vigente = TRUE;

CREATE TABLE plantilla_paso (
    id_paso      SERIAL PRIMARY KEY,
    id_plantilla INT  NOT NULL REFERENCES plantilla(id_plantilla) ON DELETE CASCADE,
    descr        TEXT NOT NULL,
    orden        INT  NOT NULL,
    activo       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE checklist (
    id_check   SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    fecha_ini  DATE,
    fecha_ter  DATE,
    proposito  VARCHAR(50) NOT NULL CHECK (proposito IN ('preparacion', 'reasignacion')),
    estado     VARCHAR(50) NOT NULL CHECK (estado IN ('abierto', 'cerrado', 'cancelado')),
    id_usuario INT REFERENCES usuario_sistema(id_usuario),
    id_act     INT NOT NULL REFERENCES activo_ti(id_act),
    id_asig    INT REFERENCES asignacion(id_asig)
);

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

INSERT INTO plantilla (nombre, proposito, vigente) VALUES
('Preparación estándar de equipo', 'preparacion', TRUE),
('Reasignación estándar de equipo', 'reasignacion', TRUE);

INSERT INTO plantilla_paso (id_plantilla, descr, orden, activo) VALUES
(1, 'Verificación visual de pantalla, teclado y carcasa', 1, TRUE),
(1, 'Prueba de encendido y test de memoria RAM', 2, TRUE),
(1, 'Limpieza física interna y cambio de pasta térmica', 3, TRUE),
(1, 'Formateo seguro de almacenamiento e instalación de SO base', 4, TRUE),
(1, 'Instalación y actualización de software corporativo y antivirus', 5, TRUE),
(1, 'Configuración de licencias y cuenta de usuario', 6, TRUE),
(1, 'Configuración de hostname y red corporativa', 7, TRUE),
(2, 'Respaldo o entrega de datos del usuario saliente', 1, TRUE),
(2, 'Borrado seguro / perfil limpio del usuario anterior', 2, TRUE),
(2, 'Reinstalación de aplicaciones según cargo del nuevo usuario', 3, TRUE),
(2, 'Asignación de cuentas y licencias del nuevo usuario', 4, TRUE),
(2, 'Prueba de entrega y verificación operativa', 5, TRUE);

-- Historial de ejemplo (activo 1) si existe en la BD
INSERT INTO checklist (nombre, fecha_ini, fecha_ter, proposito, estado, id_usuario, id_act, id_asig)
SELECT 'Preparación ingreso NB-TD-001', '2024-01-20', '2024-01-21', 'preparacion', 'cerrado', 1, 1, NULL
WHERE EXISTS (SELECT 1 FROM activo_ti WHERE id_act = 1);

INSERT INTO checklist_paso (id_check, id_paso, orden, descr, estado, observacion)
SELECT c.id_check, p.id_paso, p.orden, p.descr,
       CASE WHEN p.orden = 3 THEN 'no_aplica' ELSE 'completado' END,
       NULL
FROM checklist c
JOIN plantilla_paso p ON p.id_plantilla = 1 AND p.activo = TRUE
WHERE c.nombre = 'Preparación ingreso NB-TD-001'
  AND NOT EXISTS (
      SELECT 1 FROM checklist_paso cp WHERE cp.id_check = c.id_check
  );

COMMIT;
