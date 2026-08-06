-- Elimina folio y proveedor de factura: solo fecha_em + ruta PDF.

ALTER TABLE factura DROP COLUMN IF EXISTS num_folio;
ALTER TABLE factura DROP COLUMN IF EXISTS id_prov_fact;
DROP TABLE IF EXISTS proveedor_factura;
