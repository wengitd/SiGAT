import { useEffect, useState } from "react"
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert,
    TextField, Autocomplete, Typography, IconButton, Divider, Box,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import axiosClient from "../api/axiosClient"
import { resolverSolicitudBaja } from "../services/solicitudBajaService"

const OPCIONES_RESOLUCION = [
    { value: "aprobada", label: "Aprobar" },
    { value: "rechazada", label: "Rechazar" },
]

function limpiarError(setErrores, campo) {
    setErrores(prev => {
        if (!prev[campo]) return prev
        const next = { ...prev }
        delete next[campo]
        return next
    })
}

/**
 * Modal para registrar la resolución (aprobación/rechazo) de una solicitud
 * de baja pendiente. La decisión de jefatura se toma por fuera del sistema
 * (correo); aquí solo se deja constancia de lo ya resuelto.
 */
export default function ResolverBajaModal({ open, onClose, solicitud, onResuelta }) {
    const [usuariosOpciones, setUsuariosOpciones] = useState([])
    const [value, setValue] = useState({ estado_sol: "aprobada", ref_aprob: "", id_emp_aprob: "" })
    const [errores, setErrores] = useState({})
    const [errorApi, setErrorApi] = useState("")
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        if (!open) return
        setValue({ estado_sol: "aprobada", ref_aprob: "", id_emp_aprob: "" })
        setErrores({})
        setErrorApi("")
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

    const resolucionSeleccionada = OPCIONES_RESOLUCION.find(o => o.value === value.estado_sol) ?? null
    const aprobadorSeleccionado = usuariosOpciones.find(e => e.id_emp === value.id_emp_aprob) ?? null

    function validar() {
        const nuevos = {}
        if (!value.estado_sol) nuevos.estado_sol = "Selecciona la resolución"
        setErrores(nuevos)
        return Object.keys(nuevos).length === 0
    }

    async function guardar() {
        if (!validar()) return
        setGuardando(true)
        setErrorApi("")
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
            setErrorApi(err.response?.data?.detail ?? "Error al registrar la resolución")
        } finally {
            setGuardando(false)
        }
    }

    function handleClose() {
        if (guardando) return
        onClose()
    }

    if (!solicitud) return null

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            slotProps={{
                paper: {
                    sx: { borderRadius: 1 },
                },
            }}
        >
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1, pb: 1 }}>
                <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
                    Registrar resolución de baja
                </Typography>
                <IconButton onClick={handleClose} size="small" disabled={guardando} aria-label="Cerrar">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {errorApi && <Alert severity="error">{errorApi}</Alert>}

                    <TextField
                        label="Motivo original"
                        value={solicitud.motivo_baja}
                        disabled
                        fullWidth
                        multiline
                    />

                    <Autocomplete
                        fullWidth
                        options={OPCIONES_RESOLUCION}
                        value={resolucionSeleccionada}
                        getOptionLabel={(o) => o.label ?? ""}
                        isOptionEqualToValue={(a, b) => a.value === b.value}
                        onChange={(_, opt) => {
                            setValue(prev => ({ ...prev, estado_sol: opt?.value ?? "" }))
                            limpiarError(setErrores, "estado_sol")
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Resolución"
                                required
                                error={!!errores.estado_sol}
                                helperText={errores.estado_sol}
                            />
                        )}
                    />

                    <Autocomplete
                        fullWidth
                        options={usuariosOpciones}
                        value={aprobadorSeleccionado}
                        getOptionLabel={(e) => e.nombre ?? ""}
                        isOptionEqualToValue={(a, b) => a.id_emp === b.id_emp}
                        onChange={(_, opt) => {
                            setValue(prev => ({ ...prev, id_emp_aprob: opt?.id_emp ?? "" }))
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Aprobada/rechazada por (opcional)"
                            />
                        )}
                    />

                    <TextField
                        label="Referencia del correo de aprobación (opcional)"
                        value={value.ref_aprob}
                        onChange={(e) => setValue(prev => ({ ...prev, ref_aprob: e.target.value }))}
                        fullWidth
                    />
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
                <Button onClick={handleClose} disabled={guardando}>Cancelar</Button>
                <Button variant="contained" onClick={guardar} disabled={guardando}>
                    {guardando ? "Guardando…" : "Guardar resolución"}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
