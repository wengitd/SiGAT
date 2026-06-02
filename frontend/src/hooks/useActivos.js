import { useState, useEffect } from "react";
import { getActivos } from "../services/activoService";



export default function useActivos(){
    const [activos, setActivos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect (() => {
        getActivos().then(data => {
            setActivos(data)
            setLoading (false) 
        })
    },[])    
    return {activos, loading}
}

