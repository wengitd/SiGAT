import { useEffect, useState } from "react"
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert,
    TextField, FormControl, InputLabel, Select, MenuItem,
} from "@mui/material"
import axiosClient from "../api/axiosClient"
import { resolverSolicitudBaja } from "../services/solicitudBajaService"

/**
 * Modal para registrar la resolución (aprobación/rechazo) de una solicitud
 * de baja pendiente. La decisión de jefatura se toma por fuera del sistema
 * (correo); aquí solo se deja constancia de lo ya resuelto.
 */
export default function ResolverBajaModal({ open, onClose, solicitud, onResuelta }) {
    const [usuariosOpciones, setUsuariosOpciones] = useState([])
    const [value, setValue] = useState({ estado_sol: "aprobada", ref_aprob: "", id_emp_aprob: "" })
    const [error, setError] = useState("")
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        if (!open) return
        setValue({ estado_sol: "aprobada", ref_aprob: "", id_emp_aprob: "" })
        setError("")
        // El aprobador es un usuario del sistema (consultor), no un empleado externo;
        // se cruza con /empleado/ solo para mostrar el nombre.
        Promise.all([
            axiosClient.get("/usuario_sistema/"),
            axiosClient.get("/empleado/"),
        ]).then(([usuariosRes, empleadosRes]) => {
            const idsVigentes = new Set(usuariosRes.data.filter(u => u.vigente).map(u => u.id_emp))
            setUsuariosOpciones(empleadosRes.data.filter(e => idsVigentes.has(e.id_emp)))
        })
    }, [open])

    async function guardar() {
        setGuardando(true)
        setError("")
        try {
            const payload = {
                estado_sol: value.estado_sol,
                ref_aprob: value.ref_aprob || null,
                id_emp_aprob: value.id_emp_aprob || null,
            }
            const actualizada = await resolverSolicitudBaja(solicitud.id_solbaja, payload)
            onResuelta?.(actualizada)
            onClose()
        } catch (err) {
            setError(err.response?.data?.detail ?? "Error al registrar la resolución")
        } finally {
            setGuardando(false)
        }
    }

    if (!solicitud) return null

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Registrar resolución de baja</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                {error && <Alert severity="error">{error}</Alert>}

                <TextField label="Motivo original" value={solicitud.motivo_baja} disabled fullWidth multiline />

                <FormControl fullWidth>
                    <InputLabel>Resolución</InputLabel>
                    <Select
                        label="Resolución"
                        value={value.estado_sol}
                        onChange={(e) => setValue({ ...value, estado_sol: e.target.value })}
                    >
                        <MenuItem value="aprobada">Aprobar</MenuItem>
                        <MenuItem value="rechazada">Rechazar</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel>Aprobada/rechazada por (opcional)</InputLabel>
                    <Select
                        label="Aprobada/rechazada por (opcional)"
                        value={value.id_emp_aprob}
                        onChange={(e) => setValue({ ...value, id_emp_aprob: e.target.value })}
                    >
                        <MenuItem value="">— Sin especificar —</MenuItem>
                        {usuariosOpciones.map(e => (
                            <MenuItem key={e.id_emp} value={e.id_emp}>{e.nombre}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label="Referencia del correo de aprobación (opcional)"
                    value={value.ref_aprob}
                    onChange={(e) => setValue({ ...value, ref_aprob: e.target.value })}
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button variant="contained" onClick={guardar} disabled={guardando}>Guardar resolución</Button>
            </DialogActions>
        </Dialog>
    )
}
