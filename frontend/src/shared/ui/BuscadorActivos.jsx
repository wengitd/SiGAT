import { TextField, InputAdornment } from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"

/**
 * Campo de búsqueda reutilizable para tablas de activos.
 *
 * Props:
 *   value     - string controlado (busqueda del hook useBuscador)
 *   onChange  - setter (setBusqueda del hook useBuscador)
 *   placeholder - texto del placeholder (opcional)
 */

export default function BuscadorActivos({ value, onChange, placeholder = "Buscar..." }) {
    return (
        <TextField
            size="small"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            sx={{ width: 280 }}
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                        </InputAdornment>
                    ),
                },
            }}
        />
    )
}
