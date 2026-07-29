import { useEffect, useState } from "react"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from "@mui/material"
import axiosClient from "../api/axiosClient"
import { getActivos } from "../services/activoService"
import { crearAsignacion } from "../services/asignacionService"
import AsignacionForm from "./AsignacionForm"

function hoy() {
    return new Date().toISOString().slice(0, 10)
}

/**
 * Modal de asignación activo <-> empleado, reutilizable desde
 * Inventario (activo fijo, se elige empleado) y Empleados (empleado fijo, se elige activo).
 */
export default function AsignacionModal({ open, onClose, activoFijo = null, empleadoFijo = null, onAsignado }) {
    const [activosOpciones, setActivosOpciones] = useState([])
    const [empleadosOpciones, setEmpleadosOpciones] = useState([])
    const [value, setValue] = useState({ id_act: "", id_emp: "", fecha_entr: hoy(), ruta_acta_entr: "" })
    const [error, setError] = useState("")
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        if (!open) return

        setValue({
            id_act: activoFijo?.id_act ?? "",
            id_emp: empleadoFijo?.id_emp ?? "",
            fecha_entr: hoy(),
            ruta_acta_entr: "",
        })
        setError("")

        if (!activoFijo) {
            getActivos().then(data => setActivosOpciones(data.filter(a => !a.empleado_asignado)))
        }
        if (!empleadoFijo) {
            axiosClient.get("/empleado/").then(r => setEmpleadosOpciones(r.data.filter(e => e.operatividad)))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, activoFijo, empleadoFijo])

    async function guardar() {
        if (!value.id_act || !value.id_emp || !value.fecha_entr) {
            setError("Completa el activo, el empleado y la fecha de entrega")
            return
        }
        setGuardando(true)
        setError("")
        try {
            const payload = { ...value, ruta_acta_entr: value.ruta_acta_entr || null }
            const nueva = await crearAsignacion(payload)
            onAsignado?.(nueva)
            onClose()
        } catch (err) {
            setError(err.response?.data?.detail ?? "Error al guardar la asignación")
        } finally {
            setGuardando(false)
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Asignar activo a empleado</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
                <AsignacionForm
                    value={value}
                    onChange={setValue}
                    activoFijo={activoFijo}
                    empleadoFijo={empleadoFijo}
                    activosOpciones={activosOpciones}
                    empleadosOpciones={empleadosOpciones}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button variant="contained" onClick={guardar} disabled={guardando}>Asignar</Button>
            </DialogActions>
        </Dialog>
    )
}
