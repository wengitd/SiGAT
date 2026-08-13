import { FormControl, InputLabel, Select, MenuItem } from "@mui/material"

/**
 * Dropdown de filtro reutilizable para tablas de activos.
 *
 * Props:
 *   label    - Texto del label, ej: "Tipo de equipo"
 *   opciones - Array de strings o { value, label }
 *   value    - Valor actual
 *   onChange - Callback: (valor) => void
 *   width    - Ancho del select (default 180)
 */
export default function FiltroActivos({ label, opciones = [], value, onChange, width = 180 }) {
    return (
        <FormControl size="small" sx={{ minWidth: width }}>
            <InputLabel>{label}</InputLabel>
            <Select
                label={label}
                value={value ?? ""}
                onChange={e => onChange(e.target.value)}
            >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {opciones.map(op => {
                    const esObj = typeof op === "object" && op != null
                    const val = esObj ? String(op.value) : op
                    const texto = esObj ? op.label : op
                    return (
                        <MenuItem key={val} value={val}>{texto}</MenuItem>
                    )
                })}
            </Select>
        </FormControl>
    )
}
