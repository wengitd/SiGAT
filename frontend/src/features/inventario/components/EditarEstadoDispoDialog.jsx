import { useEffect, useMemo, useState } from "react"
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Autocomplete, TextField, Alert, Box, Typography,
} from "@mui/material"
import { getTiposEstado, getDisponibilidadesPorEstado } from "../../catalogos/api"
import { updateActivo } from "../api"

const DISPO_RESERVADAS = new Set(["asignado", "de baja"])

function etiquetaActivo(activo) {
    if (!activo) return ""
    return [activo.nombre_marca, activo.nombre_modelo, activo.num_serie]
        .filter(Boolean)
        .join(" ") || `Activo #${activo.id_act}`
}

function nombreDispo(activo) {
    return activo?.nombre_dispo?.toLowerCase() ?? ""
}

/**
 * Diálogo para cambiar condición y disponibilidad de un activo.
 * Asignado y de baja quedan en sus flujos dedicados.
 */
export default function EditarEstadoDispoDialog({ open, onClose, activo, onGuardado }) {
    const [tiposEstado, setTiposEstado] = useState([])
    const [dispoPermitidas, setDispoPermitidas] = useState([])
    const [idTipoe, setIdTipoe] = useState("")
    const [idDispo, setIdDispo] = useState("")
    const [causa, setCausa] = useState("")
    const [error, setError] = useState("")
    const [guardando, setGuardando] = useState(false)

    const esDeBaja = nombreDispo(activo) === "de baja"
    const esAsignado = nombreDispo(activo) === "asignado"
    const dispoBloqueada = esDeBaja || esAsignado
    const formularioBloqueado = esDeBaja

    useEffect(() => {
        if (!open || !activo) return
        setIdTipoe(activo.id_tipoe ?? "")
        setIdDispo(activo.id_dispo ?? "")
        setCausa("")
        setError("")
        setDispoPermitidas([])
        getTiposEstado().then(setTiposEstado).catch(() => setTiposEstado([]))
    }, [open, activo])

    useEffect(() => {
        if (!open || !idTipoe) {
            setDispoPermitidas([])
            return
        }
        let cancelled = false
        getDisponibilidadesPorEstado(idTipoe)
            .then((lista) => { if (!cancelled) setDispoPermitidas(lista ?? []) })
            .catch(() => { if (!cancelled) setDispoPermitidas([]) })
        return () => { cancelled = true }
    }, [open, idTipoe])

    const opcionesDispo = useMemo(() => {
        const filtradas = dispoPermitidas.filter(
            (d) => !DISPO_RESERVADAS.has(d.nombre?.toLowerCase()),
        )
        if (!dispoBloqueada || !activo) return filtradas
        const actual = dispoPermitidas.find((d) => d.id_dispo === activo.id_dispo)
            ?? (activo.id_dispo
                ? { id_dispo: activo.id_dispo, nombre: activo.nombre_dispo }
                : null)
        if (actual && !filtradas.some((d) => d.id_dispo === actual.id_dispo)) {
            return [actual, ...filtradas]
        }
        return filtradas
    }, [dispoPermitidas, dispoBloqueada, activo])

    useEffect(() => {
        if (!open || dispoBloqueada || !idDispo) return
        const permitida = opcionesDispo.some((d) => d.id_dispo === idDispo)
        if (!permitida && dispoPermitidas.length > 0) setIdDispo("")
    }, [open, dispoBloqueada, idDispo, opcionesDispo, dispoPermitidas.length])

    const condicionSeleccionada = tiposEstado.find((t) => t.id_tipoe === idTipoe) ?? null
    const dispoSeleccionada = opcionesDispo.find((d) => d.id_dispo === idDispo) ?? null
    const condicionCambio = Boolean(activo && idTipoe && idTipoe !== activo.id_tipoe)
    const dispoCambio = Boolean(activo && idDispo && idDispo !== activo.id_dispo)
    const hayCambios = condicionCambio || dispoCambio

    async function guardar() {
        if (!activo || formularioBloqueado) return
        if (!idTipoe || !idDispo) {
            setError("Selecciona condición y disponibilidad")
            return
        }
        setGuardando(true)
        setError("")
        try {
            const payload = { id_tipoe: idTipoe, id_dispo: idDispo }
            if (condicionCambio) {
                payload.causa = causa.trim() || "Cambio de condición"
            }
            await updateActivo(activo.id_act, payload)
            onGuardado?.()
            onClose()
        } catch (err) {
            const detail = err.response?.data?.detail
            setError(typeof detail === "string" ? detail : "No se pudo actualizar el activo")
        } finally {
            setGuardando(false)
        }
    }

    return (
        <Dialog
            open={open}
            onClose={guardando ? undefined : onClose}
            maxWidth="sm"
            fullWidth
            slotProps={{ paper: { sx: { borderRadius: 1 } } }}
        >
            <DialogTitle>
                Editar estado y disponibilidad
                {activo && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                        {etiquetaActivo(activo)}
                    </Typography>
                )}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                    {esDeBaja && (
                        <Alert severity="info">
                            Un activo dado de baja no se reactiva desde aquí. Usa el flujo de solicitudes de baja.
                        </Alert>
                    )}
                    {esAsignado && (
                        <Alert severity="info">
                            La disponibilidad asignada se cambia con Devolver o Reasignar. Sí puedes actualizar la condición.
                        </Alert>
                    )}
                    {error && <Alert severity="error">{error}</Alert>}

                    <Autocomplete
                        fullWidth
                        disabled={formularioBloqueado}
                        options={tiposEstado}
                        value={condicionSeleccionada}
                        getOptionLabel={(t) => t.nombre ?? ""}
                        isOptionEqualToValue={(a, b) => a.id_tipoe === b.id_tipoe}
                        onChange={(_, opt) => setIdTipoe(opt?.id_tipoe ?? "")}
                        renderInput={(params) => (
                            <TextField {...params} label="Condición" required />
                        )}
                    />

                    <Autocomplete
                        fullWidth
                        disabled={formularioBloqueado || dispoBloqueada || !idTipoe}
                        options={opcionesDispo}
                        value={dispoSeleccionada}
                        getOptionLabel={(d) => d.nombre ?? ""}
                        isOptionEqualToValue={(a, b) => a.id_dispo === b.id_dispo}
                        onChange={(_, opt) => setIdDispo(opt?.id_dispo ?? "")}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Disponibilidad"
                                required
                                helperText={
                                    esAsignado
                                        ? "Usa Devolver o Reasignar para cambiar la disponibilidad."
                                        : !idTipoe
                                            ? "Selecciona primero la condición."
                                            : undefined
                                }
                            />
                        )}
                    />

                    {condicionCambio && !formularioBloqueado && (
                        <TextField
                            label="Motivo del cambio de condición"
                            value={causa}
                            onChange={(e) => setCausa(e.target.value)}
                            helperText="Opcional. Se registra en el historial de estados."
                            slotProps={{ htmlInput: { maxLength: 50 } }}
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={guardando}>Cancelar</Button>
                <Button
                    variant="contained"
                    onClick={guardar}
                    disabled={guardando || formularioBloqueado || !hayCambios || !idTipoe || !idDispo}
                >
                    Guardar
                </Button>
            </DialogActions>
        </Dialog>
    )
}
