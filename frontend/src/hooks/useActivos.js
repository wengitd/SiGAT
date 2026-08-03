import { useState, useEffect, useCallback } from "react";
import { getActivos } from "../services/activoService";



export default function useActivos() {
    const [activos, setActivos] = useState([])
    const [loading, setLoading] = useState(true)

    const refetch = useCallback(() => {
        setLoading(true)
        return getActivos().then(data => {
            setActivos(data)
            setLoading(false)
        })
    }, [])

    useEffect(() => {
        refetch()
    }, [refetch])

    return { activos, loading, refetch }
}

