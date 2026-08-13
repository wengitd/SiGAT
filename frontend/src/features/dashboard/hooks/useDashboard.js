import { useEffect, useRef, useState } from "react"
import { getResumenDashboard } from "../api"

/**
 * Carga el resumen del dashboard al cambiar el año del periodo.
 * El primer fetch muestra spinner completo; los siguientes, un refresh suave.
 */
export default function useDashboard(anio) {
    const [resumen, setResumen] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState(null)
    const yaCargoRef = useRef(false)

    useEffect(() => {
        let cancelled = false

        if (!yaCargoRef.current) {
            setLoading(true)
        } else {
            setRefreshing(true)
        }
        setError(null)

        getResumenDashboard(anio)
            .then((data) => {
                if (!cancelled) {
                    setResumen(data)
                    yaCargoRef.current = true
                }
            })
            .catch(() => {
                if (!cancelled) setError("No se pudo cargar el resumen del dashboard.")
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false)
                    setRefreshing(false)
                }
            })

        return () => { cancelled = true }
    }, [anio])

    return { resumen, loading, refreshing, error }
}
