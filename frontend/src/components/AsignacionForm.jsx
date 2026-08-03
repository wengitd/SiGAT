import { Box, TextField, Autocomplete } from "@mui/material"

function hoy() {
    return new Date().toISOString().slice(0, 10)
}

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
 * - `errores` mapa opcional de mensajes por campo (id_emp, fecha_entr, id_act).
 */
export default function AsignacionForm({
    value, onChange,
    activoFijo = null, empleadoFijo = null,
    activosOpciones = [], empleadosOpciones = [],
    ocultarActivo = false,
    errores = {},
}) {
    function set(campo, valor) {
        onChange({ ...value, [campo]: valor })
    }

    const empleadoSeleccionado = empleadosOpciones.find(e => e.id_emp === value.id_emp) ?? null
    const activoSeleccionado = activosOpciones.find(a => a.id_act === value.id_act) ?? null

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>

            {!ocultarActivo && (
                activoFijo
                    ? <TextField label="Activo" value={activoFijo.label} disabled fullWidth />
                    : (
                        <Autocomplete
                            fullWidth
                            options={activosOpciones}
                            value={activoSeleccionado}
                            getOptionLabel={(a) => labelActivo(a)}
                            isOptionEqualToValue={(a, b) => a.id_act === b.id_act}
                            onChange={(_, opt) => set("id_act", opt?.id_act ?? "")}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Activo"
                                    error={!!errores.id_act}
                                    helperText={errores.id_act || (activosOpciones.length === 0
                                        ? "No hay activos disponibles para asignar"
                                        : "")}
                                />
                            )}
                        />
                    )
            )}

            {empleadoFijo
                ? <TextField label="Empleado" value={empleadoFijo.label} disabled fullWidth />
                : (
                    <Autocomplete
                        fullWidth
                        options={empleadosOpciones}
                        value={empleadoSeleccionado}
                        getOptionLabel={(e) => e.nombre ?? ""}
                        isOptionEqualToValue={(a, b) => a.id_emp === b.id_emp}
                        onChange={(_, opt) => set("id_emp", opt?.id_emp ?? "")}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Empleado"
                                error={!!errores.id_emp}
                                helperText={errores.id_emp}
                            />
                        )}
                    />
                )
            }

            <TextField
                label="Fecha de entrega"
                type="date"
                value={value.fecha_entr}
                onChange={(e) => set("fecha_entr", e.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoy() } }}
                fullWidth
                error={!!errores.fecha_entr}
                helperText={errores.fecha_entr}
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
