import { useState, useMemo } from "react"

/**
 * Hook para filtrar filas de un DataGrid por texto libre + filtros exactos.
 *
 * @param {Array}  rows    - Filas originales del DataGrid
 * @param {Array}  campos  - Keys para búsqueda de texto, ej: ["marca", "modelo"]
 *
 * @returns {{ busqueda, setBusqueda, filtros, setFiltro, limpiarFiltros, filasFiltradas }}
 *
 * Uso de filtros:
 *   setFiltro("nombre_tipoeq", "Notebook")  → activa filtro exacto en ese campo
 *   setFiltro("nombre_tipoeq", "")          → limpia ese filtro
 *   limpiarFiltros()                        → limpia todos los filtros y la búsqueda
 */
export default function useBuscador(rows, campos) {
    const [busqueda, setBusqueda] = useState("")
    const [filtros,  setFiltros]  = useState({})   // { campo: valor }

    function setFiltro(campo, valor) {
        setFiltros(prev => ({ ...prev, [campo]: valor }))
    }

    function limpiarFiltros() {
        setBusqueda("")
        setFiltros({})
    }

    const filasFiltradas = useMemo(() => {
        let resultado = rows

        // 1. Filtros exactos (dropdowns)
        for (const [campo, valor] of Object.entries(filtros)) {
            if (valor !== "" && valor != null) {
                resultado = resultado.filter(row =>
                    String(row[campo] ?? "").toLowerCase() === valor.toLowerCase()
                )
            }
        }

        // 2. Búsqueda de texto libre
        const q = busqueda.trim().toLowerCase()
        if (q) {
            resultado = resultado.filter(row =>
                campos.some(campo =>
                    String(row[campo] ?? "").toLowerCase().includes(q)
                )
            )
        }

        return resultado
    }, [rows, busqueda, filtros, campos])

    return { busqueda, setBusqueda, filtros, setFiltro, limpiarFiltros, filasFiltradas }
}
