/** Utilidades de formato compartidas (fechas, etc.). */

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}
