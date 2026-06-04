// useActivosPorTipo.js
import { useState, useEffect } from "react";
import { getActivos } from "../services/activoService";

export default function useActivosPorTipo(tipo) {
    const [activos, setActivos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getActivos().then(data => {
            setActivos(data.filter(a => a.tipo === tipo))
            setLoading(false)
        })
    }, [tipo])

    return { activos, loading, setActivos }
}