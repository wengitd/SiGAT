import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Typography } from "@mui/material"

// Etiqueta legible para un activo en el dropdown
function labelActivo(a) {
    return `${a.nombre_marca ?? ""} ${a.nombre_modelo ?? ""} — N° serie ${a.num_serie ?? "s/n"}`.trim()
}

/**
 * Formulario reutilizable de asignación activo <-> empleado.
 * Se usa embebido tanto en un modal (Inventario, Empleados) como
 * dentro del Stepper de creación de activo.
 *
 * - Si se pasa `activoFijo`, el activo se muestra fijo (no editable) y no se listan opciones.
 * - Si se pasa `empleadoFijo`, el empleado se muestra fijo (no editable) y no se listan opciones.
 * - `ocultarActivo` oculta por completo el selector de activo (caso: activo aún no existe).
 */
export default function AsignacionForm({
    value, onChange,
    activoFijo = null, empleadoFijo = null,
    activosOpciones = [], empleadosOpciones = [],
    ocultarActivo = false,
}) {
    function set(campo, valor) {
        onChange({ ...value, [campo]: valor })
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>

            {!ocultarActivo && (
                activoFijo
                    ? <TextField label="Activo" value={activoFijo.label} disabled fullWidth />
                    : (
                        <FormControl fullWidth>
                            <InputLabel>Activo</InputLabel>
                            <Select
                                label="Activo"
                                value={value.id_act}
                                onChange={(e) => set("id_act", e.target.value)}
                            >
                                {activosOpciones.map(a => (
                                    <MenuItem key={a.id_act} value={a.id_act}>{labelActivo(a)}</MenuItem>
                                ))}
                            </Select>
                            {activosOpciones.length === 0 &&
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                    No hay activos disponibles para asignar
                                </Typography>
                            }
                        </FormControl>
                    )
            )}

            {empleadoFijo
                ? <TextField label="Empleado" value={empleadoFijo.label} disabled fullWidth />
                : (
                    <FormControl fullWidth>
                        <InputLabel>Empleado</InputLabel>
                        <Select
                            label="Empleado"
                            value={value.id_emp}
                            onChange={(e) => set("id_emp", e.target.value)}
                        >
                            {empleadosOpciones.map(e => (
                                <MenuItem key={e.id_emp} value={e.id_emp}>{e.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )
            }

            <TextField
                label="Fecha de entrega"
                type="date"
                value={value.fecha_entr}
                onChange={(e) => set("fecha_entr", e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
            />

            <TextField
                label="Ruta acta de entrega (opcional)"
                value={value.ruta_acta_entr ?? ""}
                onChange={(e) => set("ruta_acta_entr", e.target.value)}
                fullWidth
            />
        </Box>
    )
}
