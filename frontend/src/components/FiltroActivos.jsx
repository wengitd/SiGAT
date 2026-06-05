import { FormControl, InputLabel, Select, MenuItem } from "@mui/material"

/**
 * Dropdown de filtro reutilizable para tablas de activos.
 *
 * Props:
 *   label    - Texto del label, ej: "Tipo de equipo"
 *   campo    - Key del campo a filtrar, ej: "nombre_tipoeq"
 *   opciones - Array de strings con los valores posibles, ej: ["Notebook", "Gabinete"]
 *   value    - Valor actual (filtros[campo] del hook useBuscador)
 *   onChange - Callback: (valor) => setFiltro(campo, valor)
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
                {opciones.map(op => (
                    <MenuItem key={op} value={op}>{op}</MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}
