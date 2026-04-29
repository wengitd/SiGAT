-- ===================================
-- SiGAT 
-- Script de inicialización de BD
-- PostgreSQL 16
-- ===================================

-- Cambios de estado
--====================================

CREATE TABLE tipos_estado (
    id_tipo_estado  SERIAL PRIMARY KEY,
    nom_estado      VARCHAR(50) NOT NULL UNIQUE,
    descr_tipoe     TEXT,
    operativo       BOOLEAN NOT NULL DEFAULT TRUE
)

INSERT INTO tipos_estado (nom_estado,descr_tipoe) VALUES
('disponible',    'Activo listo para asignar un empleado'),
('en_preparacion','Activo en proceso de gestion por el técnico'),
('asignado',      'Activo entregado a empleado'),
('en_mantencion', 'Activo en revisión o reparación'),
('de baja',       'Activo retirado del Inventario');

