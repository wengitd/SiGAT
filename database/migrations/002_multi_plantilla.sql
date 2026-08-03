-- Migración: varias plantillas vigentes por propósito + FK en checklist.

BEGIN;

DROP INDEX IF EXISTS uq_plantilla_vigente_proposito;

ALTER TABLE checklist
    ADD COLUMN IF NOT EXISTS id_plantilla INT REFERENCES plantilla(id_plantilla);

-- Plantillas adicionales de ejemplo (idempotente por nombre)
INSERT INTO plantilla (nombre, proposito, vigente)
SELECT 'Preparación rápida (equipo nuevo)', 'preparacion', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM plantilla WHERE nombre = 'Preparación rápida (equipo nuevo)'
);

INSERT INTO plantilla (nombre, proposito, vigente)
SELECT 'Reasignación con formateo', 'reasignacion', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM plantilla WHERE nombre = 'Reasignación con formateo'
);

-- Pasos de preparación rápida
INSERT INTO plantilla_paso (id_plantilla, descr, orden, activo)
SELECT p.id_plantilla, v.descr, v.orden, TRUE
FROM plantilla p
CROSS JOIN (VALUES
    ('Verificación visual rápida', 1),
    ('Formateo e instalación de SO base', 2),
    ('Software corporativo y antivirus', 3),
    ('Hostname, red y cuenta de usuario', 4)
) AS v(descr, orden)
WHERE p.nombre = 'Preparación rápida (equipo nuevo)'
  AND NOT EXISTS (SELECT 1 FROM plantilla_paso pp WHERE pp.id_plantilla = p.id_plantilla);

-- Pasos de reasignación con formateo
INSERT INTO plantilla_paso (id_plantilla, descr, orden, activo)
SELECT p.id_plantilla, v.descr, v.orden, TRUE
FROM plantilla p
CROSS JOIN (VALUES
    ('Respaldo o entrega de datos del usuario saliente', 1),
    ('Formateo seguro e instalación de SO base', 2),
    ('Borrado / perfil limpio del usuario anterior', 3),
    ('Reinstalación de aplicaciones según cargo', 4),
    ('Cuentas y licencias del nuevo usuario', 5),
    ('Prueba de entrega y verificación operativa', 6)
) AS v(descr, orden)
WHERE p.nombre = 'Reasignación con formateo'
  AND NOT EXISTS (SELECT 1 FROM plantilla_paso pp WHERE pp.id_plantilla = p.id_plantilla);

COMMIT;
