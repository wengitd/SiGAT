import { useEffect, useState } from "react"
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert,
    TextField, Autocomplete, Typography, IconButton, Divider, Box,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import axiosClient from "../api/axiosClient"
import { getActivos } from "../services/activoService"
import { crearSolicitudBaja } from "../services/solicitudBajaService"

function labelActivo(a) {
    return `${a.nombre_marca ?? ""} ${a.nombre_modelo ?? ""} — N° serie ${a.num_serie ?? "s/n"}`.trim()
}

function limpiarError(setErrores, campo) {
    setErrores(prev => {
        if (!prev[campo]) return prev
        const next = { ...prev }
        delete next[campo]
        return next
    })
}

/**
 * Modal para que el solicitante registre una solicitud de baja de un activo.
 * La aprobación/rechazo se registra por fuera, en ResolverBajaModal.
 */
export default function SolicitudBajaModal({ open, onClose, solicitudesPendientes = [], onCreada }) {
    const [activosOpciones, setActivosOpciones] = useState([])
    const [tiposEstado, setTiposEstado] = useState([])
    const [value, setValue] = useState({ id_act: "", motivo_baja: "", id_tipoe: "" })
    const [errores, setErrores] = useState({})
    const [errorApi, setErrorApi] = useState("")
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        if (!open) return

        setValue({ id_act: "", motivo_baja: "", id_tipoe: "" })
        setErrores({})
        setErrorApi("")

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

    const activoSeleccionado = activosOpciones.find(a => a.id_act === value.id_act) ?? null
    const condicionSeleccionada = tiposEstado.find(t => t.id_tipoe === value.id_tipoe) ?? null

    function validar() {
        const nuevos = {}
        if (!value.id_act) nuevos.id_act = "Selecciona el activo"
        if (!value.id_tipoe) nuevos.id_tipoe = "Selecciona la condición"
        if (!value.motivo_baja.trim()) nuevos.motivo_baja = "El motivo es obligatorio"
        setErrores(nuevos)
        return Object.keys(nuevos).length === 0
    }

    async function guardar() {
        if (!validar()) return
        setGuardando(true)
        setErrorApi("")
        try {
            const nueva = await crearSolicitudBaja(value)
            onCreada?.(nueva)
            onClose()
        } catch (err) {
            setErrorApi(err.response?.data?.detail ?? "Error al registrar la solicitud")
        } finally {
            setGuardando(false)
        }
    }

    function handleClose() {
        if (guardando) return
        onClose()
    }

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
                    Solicitar baja de activo
                </Typography>
                <IconButton onClick={handleClose} size="small" disabled={guardando} aria-label="Cerrar">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {errorApi && <Alert severity="error">{errorApi}</Alert>}

                    <Autocomplete
                        fullWidth
                        options={activosOpciones}
                        value={activoSeleccionado}
                        getOptionLabel={(a) => labelActivo(a)}
                        isOptionEqualToValue={(a, b) => a.id_act === b.id_act}
                        onChange={(_, opt) => {
                            setValue(prev => ({ ...prev, id_act: opt?.id_act ?? "" }))
                            limpiarError(setErrores, "id_act")
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Activo"
                                required
                                error={!!errores.id_act}
                                helperText={errores.id_act}
                            />
                        )}
                    />

                    <Autocomplete
                        fullWidth
                        options={tiposEstado}
                        value={condicionSeleccionada}
                        getOptionLabel={(t) => t.nombre ?? ""}
                        isOptionEqualToValue={(a, b) => a.id_tipoe === b.id_tipoe}
                        onChange={(_, opt) => {
                            setValue(prev => ({ ...prev, id_tipoe: opt?.id_tipoe ?? "" }))
                            limpiarError(setErrores, "id_tipoe")
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Nueva condición del activo"
                                required
                                error={!!errores.id_tipoe}
                                helperText={errores.id_tipoe}
                            />
                        )}
                    />

                    <TextField
                        label="Motivo de la baja"
                        value={value.motivo_baja}
                        onChange={(e) => {
                            setValue(prev => ({ ...prev, motivo_baja: e.target.value }))
                            limpiarError(setErrores, "motivo_baja")
                        }}
                        multiline
                        minRows={3}
                        fullWidth
                        required
                        error={!!errores.motivo_baja}
                        helperText={errores.motivo_baja}
                    />
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
                <Button onClick={handleClose} disabled={guardando}>Cancelar</Button>
                <Button variant="contained" onClick={guardar} disabled={guardando}>
                    {guardando ? "Solicitando…" : "Solicitar"}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
