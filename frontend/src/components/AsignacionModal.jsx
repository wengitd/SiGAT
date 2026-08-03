import { useEffect, useState } from "react"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from "@mui/material"
import axiosClient from "../api/axiosClient"
import { getActivos } from "../services/activoService"
import { crearAsignacion } from "../services/asignacionService"
import { getElegibilidad } from "../services/checklistService"
import AsignacionForm from "./AsignacionForm"

function hoy() {
    return new Date().toISOString().slice(0, 10)
}

/**
 * Modal de asignación / reasignación activo <-> empleado, reutilizable desde
 * Inventario (activo fijo, se elige empleado) y Empleados (empleado fijo, se elige activo).
 */
export default function AsignacionModal({
    open,
    onClose,
    activoFijo = null,
    empleadoFijo = null,
    onAsignado,
    onAbrirChecklist,
}) {
    const [activosOpciones, setActivosOpciones] = useState([])
    const [empleadosOpciones, setEmpleadosOpciones] = useState([])
    const [value, setValue] = useState({ id_act: "", id_emp: "", fecha_entr: hoy(), ruta_acta_entr: "" })
    const [error, setError] = useState("")
    const [guardando, setGuardando] = useState(false)
    const [elegibilidad, setElegibilidad] = useState(null)

    const esReasignacion = Boolean(activoFijo?.empleado_asignado)

    useEffect(() => {
        if (!open) return

        setValue({
            id_act: activoFijo?.id_act ?? "",
            id_emp: empleadoFijo?.id_emp ?? "",
            fecha_entr: hoy(),
            ruta_acta_entr: "",
        })
        setError("")
        setElegibilidad(null)

        if (!activoFijo) {
            getActivos().then(data => setActivosOpciones(data.filter(a =>
                !a.empleado_asignado && a.nombre_dispo?.toLowerCase() !== "de_baja"
            )))
        }
        if (!empleadoFijo) {
            axiosClient.get("/empleado/").then(r => setEmpleadosOpciones(r.data.filter(e => e.operatividad)))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, activoFijo, empleadoFijo])

    useEffect(() => {
        if (!open) return
        const idAct = activoFijo?.id_act ?? value.id_act
        if (!idAct) {
            setElegibilidad(null)
            return
        }
        const tipo = activoFijo?.tipo
            ?? activosOpciones.find((a) => a.id_act === idAct)?.tipo
        if (tipo && tipo !== "equipo_computo") {
            setElegibilidad({ puede: true })
            return
        }
        let cancelled = false
        getElegibilidad(idAct)
            .then((data) => { if (!cancelled) setElegibilidad(data) })
            .catch(() => {
                if (!cancelled) setElegibilidad({ puede: false, motivo: "No se pudo verificar el checklist" })
            })
        return () => { cancelled = true }
    }, [open, activoFijo, value.id_act, activosOpciones])

    async function guardar() {
        if (!value.id_act || !value.id_emp || !value.fecha_entr) {
            setError("Completa el activo, el empleado y la fecha de entrega")
            return
        }
        if (elegibilidad && !elegibilidad.puede) {
            setError(elegibilidad.motivo ?? "Complete el checklist requerido antes de continuar")
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

    const bloqueadoPorChecklist = Boolean(elegibilidad && !elegibilidad.puede)

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{esReasignacion ? "Reasignar activo a nuevo empleado" : "Asignar activo a empleado"}</DialogTitle>
            <DialogContent>
                {esReasignacion && (
                    <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                        Este activo está asignado actualmente a <strong>{activoFijo.empleado_asignado}</strong>. Al guardar, se registrará la devolución automática y se reasignará al nuevo empleado seleccionado.
                    </Alert>
                )}
                {bloqueadoPorChecklist && (
                    <Alert
                        severity="warning"
                        sx={{ mt: 1, mb: 1 }}
                        action={onAbrirChecklist && elegibilidad?.checklist_requerido ? (
                            <Button
                                color="inherit"
                                size="small"
                                onClick={() => onAbrirChecklist(
                                    elegibilidad.checklist_requerido,
                                    activoFijo?.id_act ?? value.id_act,
                                )}
                            >
                                Abrir checklist
                            </Button>
                        ) : undefined}
                    >
                        {elegibilidad.motivo}
                    </Alert>
                )}
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
                <Button
                    variant="contained"
                    onClick={guardar}
                    disabled={guardando || bloqueadoPorChecklist}
                >
                    {esReasignacion ? "Reasignar" : "Asignar"}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
