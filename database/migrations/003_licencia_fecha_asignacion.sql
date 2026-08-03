-- Mueve la fecha desde el contrato (licencia) a la asignación (emp_lic).
-- fecha_ini / fecha_exp dejan de existir en licencia.

ALTER TABLE emp_lic ADD COLUMN IF NOT EXISTS fecha_asignacion DATE;

UPDATE emp_lic
SET fecha_asignacion = CURRENT_DATE
WHERE fecha_asignacion IS NULL;

ALTER TABLE emp_lic ALTER COLUMN fecha_asignacion SET NOT NULL;

ALTER TABLE licencia DROP COLUMN IF EXISTS fecha_ini;
ALTER TABLE licencia DROP COLUMN IF EXISTS fecha_exp;
