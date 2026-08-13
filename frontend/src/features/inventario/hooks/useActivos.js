import { useState, useEffect, useCallback, useRef } from "react";
import { getActivos } from "../api";

/**
 * Carga activos desde la API. Si se pasan filtros, se reconsulta al cambiar.
 * @param {object} [filtrosApi] - { tipo, id_dispo, id_tipoe, mac }
 */
export default function useActivos(filtrosApi = {}) {
    const [activos, setActivos] = useState([])
    const [loading, setLoading] = useState(true)
    const filtrosRef = useRef(filtrosApi)
    filtrosRef.current = filtrosApi

    const refetch = useCallback(() => {
        setLoading(true)
        return getActivos(filtrosRef.current).then(data => {
            setActivos(data)
            setLoading(false)
        }).catch(() => {
            setActivos([])
            setLoading(false)
        })
    }, [])

    useEffect(() => {
        setLoading(true)
        let cancelled = false
        getActivos(filtrosApi).then(data => {
            if (!cancelled) {
                setActivos(data)
                setLoading(false)
            }
        }).catch(() => {
            if (!cancelled) {
                setActivos([])
                setLoading(false)
            }
        })
        return () => { cancelled = true }
    }, [
        filtrosApi.tipo,
        filtrosApi.id_dispo,
        filtrosApi.id_tipoe,
        filtrosApi.mac,
    ])

    return { activos, loading, refetch }
}
