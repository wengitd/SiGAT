import { useEffect, useState } from "react"
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert,
    TextField, FormControl, InputLabel, Select, MenuItem,
} from "@mui/material"
import axiosClient from "../api/axiosClient"
import { getActivos } from "../services/activoService"
import { crearSolicitudBaja } from "../services/solicitudBajaService"

function labelActivo(a) {
    return `${a.nombre_marca ?? ""} ${a.nombre_modelo ?? ""} — N° serie ${a.num_serie ?? "s/n"}`.trim()
}

/**
 * Modal para que el solicitante registre una solicitud de baja de un activo.
 * La aprobación/rechazo se registra por fuera, en ResolverBajaModal.
 */
export default function SolicitudBajaModal({ open, onClose, solicitudesPendientes = [], onCreada }) {
    const [activosOpciones, setActivosOpciones] = useState([])
    const [tiposEstado, setTiposEstado] = useState([])
    const [value, setValue] = useState({ id_act: "", motivo_baja: "", id_tipoe: "" })
    const [error, setError] = useState("")
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        if (!open) return

        setValue({ id_act: "", motivo_baja: "", id_tipoe: "" })
        setError("")

        getActivos().then(data => {
            const idsConSolicitudPendiente = new Set(solicitudesPendientes.map(s => s.id_act))
            setActivosOpciones(
                data.filter(a =>
                    !idsConSolicitudPendiente.has(a.id_act) &&
                    a.nombre_dispo?.toLowerCase() !== "de_baja"
                )
            )
        })
        axiosClient.get("/tipos-estado/").then(r => {
            setTiposEstado(r.data.filter(t => t.nombre?.toLowerCase() !== "bueno"))
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    async function guardar() {
        if (!value.id_act || !value.motivo_baja.trim() || !value.id_tipoe) {
            setError("Completa el activo, el motivo de la baja y la nueva condición")
            return
        }
        setGuardando(true)
        setError("")
        try {
            const nueva = await crearSolicitudBaja(value)
            onCreada?.(nueva)
            onClose()
        } catch (err) {
            setError(err.response?.data?.detail ?? "Error al registrar la solicitud")
        } finally {
            setGuardando(false)
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Solicitar baja de activo</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                {error && <Alert severity="error">{error}</Alert>}

                <FormControl fullWidth>
                    <InputLabel>Activo</InputLabel>
                    <Select
                        label="Activo"
                        value={value.id_act}
                        onChange={(e) => setValue({ ...value, id_act: e.target.value })}
                    >
                        {activosOpciones.map(a => (
                            <MenuItem key={a.id_act} value={a.id_act}>{labelActivo(a)}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel>Nueva condición del activo</InputLabel>
                    <Select
                        label="Nueva condición del activo"
                        value={value.id_tipoe}
                        onChange={(e) => setValue({ ...value, id_tipoe: e.target.value })}
                    >
                        {tiposEstado.map(t => (
                            <MenuItem key={t.id_tipoe} value={t.id_tipoe}>{t.nombre}</MenuItem>
                        ))}
                    </Select>
                </FormControl>


                <TextField
                    label="Motivo de la baja"
                    value={value.motivo_baja}
                    onChange={(e) => setValue({ ...value, motivo_baja: e.target.value })}
                    multiline
                    minRows={3}
                    fullWidth
                />

                

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button variant="contained" onClick={guardar} disabled={guardando}>Solicitar</Button>
            </DialogActions>
        </Dialog>
    )
}
