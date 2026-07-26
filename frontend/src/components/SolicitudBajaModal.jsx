import { useEffect, useState } from "react"
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert,
    TextField, FormControl, InputLabel, Select, MenuItem,
} from "@mui/material"
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
    const [value, setValue] = useState({ id_act: "", motivo_baja: "" })
    const [error, setError] = useState("")
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        if (!open) return

        setValue({ id_act: "", motivo_baja: "" })
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    async function guardar() {
        if (!value.id_act || !value.motivo_baja.trim()) {
            setError("Completa el activo y el motivo de la baja")
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
