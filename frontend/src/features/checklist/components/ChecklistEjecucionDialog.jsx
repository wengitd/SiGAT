import { useEffect, useMemo, useState } from "react"
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert,
    Box, Typography, LinearProgress, TextField, MenuItem, Stack, Chip, CircularProgress,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import {
    iniciarChecklist, actualizarPasoChecklist, cerrarChecklist, cancelarChecklist,
    getChecklistsPorActivo, resumenChecklist,
} from "../../checklist/api"
import { getPlantillas } from "../../checklist/api"
import { useDialog } from "../../../core/dialog/DialogContext"

const ESTADOS = [
    { value: "Pendiente", label: "Pendiente" },
    { value: "En Proceso", label: "En proceso" },
    { value: "Completado", label: "Completado" },
    { value: "No Aplica", label: "No aplica" },
]

const LABEL_PROPOSITO = {
    Preparacion: "Preparación",
    Reasignacion: "Reasignación",
}

/**
 * Diálogo para iniciar/ejecutar/cerrar un checklist de preparación o reasignación.
 * Si no hay checklist abierto, exige elegir una plantilla vigente.
 */
export default function ChecklistEjecucionDialog({
    open,
    onClose,
    activo,
    proposito,
    onCompletado,
}) {
    const { confirm, alert: showAlert } = useDialog()
    const [checklist, setChecklist] = useState(null)
    const [plantillas, setPlantillas] = useState([])
    const [idPlantilla, setIdPlantilla] = useState("")
    const [fase, setFase] = useState("loading") // loading | pick | exec
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const progreso = useMemo(() => resumenChecklist(checklist), [checklist])
    const puedeCerrar = progreso.total > 0 && progreso.resueltos === progreso.total
    const plantillaSel = plantillas.find((p) => p.id_plantilla === Number(idPlantilla))

    useEffect(() => {
        if (!open || !activo?.id_act || !proposito) return
        let cancelled = false

        async function cargar() {
            setFase("loading")
            setError("")
            setChecklist(null)
            setIdPlantilla("")
            setPlantillas([])
            try {
                const lista = await getChecklistsPorActivo(activo.id_act)
                if (cancelled) return
                const abierto = lista.find(
                    (c) => c.proposito === proposito && c.estado === "Abierto",
                )
                if (abierto) {
                    setChecklist(abierto)
                    setFase("exec")
                    return
                }
                const opts = await getPlantillas({ proposito, vigente: true })
                if (cancelled) return
                setPlantillas(opts)
                if (opts.length === 1) setIdPlantilla(String(opts[0].id_plantilla))
                setFase("pick")
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.detail ?? "No se pudo cargar el checklist")
                    setFase("pick")
                }
            }
        }

        cargar()
        return () => { cancelled = true }
    }, [open, activo?.id_act, proposito])

    async function handleIniciar() {
        if (!idPlantilla) {
            setError("Seleccione una plantilla")
            return
        }
        setSaving(true)
        setError("")
        try {
            const nuevo = await iniciarChecklist(activo.id_act, proposito, Number(idPlantilla))
            setChecklist(nuevo)
            setFase("exec")
        } catch (err) {
            setError(err.response?.data?.detail ?? "No se pudo iniciar el checklist")
        } finally {
            setSaving(false)
        }
    }

    async function handleEstado(paso, estado) {
        setSaving(true)
        setError("")
        try {
            const actualizado = await actualizarPasoChecklist(paso.id_cpaso, { estado })
            setChecklist((prev) => ({
                ...prev,
                pasos: prev.pasos.map((p) => (p.id_cpaso === actualizado.id_cpaso ? actualizado : p)),
            }))
        } catch (err) {
            setError(err.response?.data?.detail ?? "Error al actualizar el paso")
        } finally {
            setSaving(false)
        }
    }

    async function handleObs(paso, observacion) {
        try {
            const actualizado = await actualizarPasoChecklist(paso.id_cpaso, { observacion })
            setChecklist((prev) => ({
                ...prev,
                pasos: prev.pasos.map((p) => (p.id_cpaso === actualizado.id_cpaso ? actualizado : p)),
            }))
        } catch (err) {
            setError(err.response?.data?.detail ?? "Error al guardar observación")
        }
    }

    async function handleCerrar() {
        if (!checklist) return
        setSaving(true)
        setError("")
        try {
            const cerrado = await cerrarChecklist(checklist.id_check)
            setChecklist(cerrado)
            await showAlert({
                title: "Checklist cerrado",
                message: `El checklist de ${LABEL_PROPOSITO[proposito]} quedó listo.`,
                severity: "success",
            })
            onCompletado?.(cerrado)
            onClose()
        } catch (err) {
            setError(err.response?.data?.detail ?? "No se pudo cerrar el checklist")
        } finally {
            setSaving(false)
        }
    }

    async function handleCancelar() {
        if (!checklist) return
        const ok = await confirm({
            title: "Cancelar checklist",
            message: "¿Cancelar esta ejecución? Deberá elegir plantilla e iniciar una nueva para continuar.",
            severity: "warning",
            confirmText: "Cancelar checklist",
        })
        if (!ok) return
        setSaving(true)
        try {
            await cancelarChecklist(checklist.id_check)
            onClose()
        } catch (err) {
            setError(err.response?.data?.detail ?? "No se pudo cancelar")
        } finally {
            setSaving(false)
        }
    }

    const labelActivo = activo
        ? `${activo.nombre_marca ?? ""} ${activo.nombre_modelo ?? ""}`.trim() || `Activo #${activo.id_act}`
        : ""

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Checklist de {LABEL_PROPOSITO[proposito] ?? proposito}
                {labelActivo ? ` — ${labelActivo}` : ""}
            </DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {fase === "loading" && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {fase === "pick" && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Seleccione la plantilla a aplicar. Debe completar todos los pasos antes de
                            {proposito === "Preparacion" ? " asignar" : " reasignar"} el equipo.
                        </Typography>
                        {plantillas.length === 0 ? (
                            <Alert severity="warning">
                                No hay plantillas vigentes de {LABEL_PROPOSITO[proposito]}.
                                Créelas en Mantenedor → Plantillas de preparación.
                            </Alert>
                        ) : (
                            <>
                                <TextField
                                    select
                                    label="Plantilla"
                                    size="small"
                                    fullWidth
                                    value={idPlantilla}
                                    onChange={(e) => setIdPlantilla(e.target.value)}
                                >
                                    {plantillas.map((p) => (
                                        <MenuItem key={p.id_plantilla} value={String(p.id_plantilla)}>
                                            {p.nombre} ({(p.pasos ?? []).filter((x) => x.activo).length} pasos)
                                        </MenuItem>
                                    ))}
                                </TextField>
                                {plantillaSel && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Pasos de la plantilla:
                                        </Typography>
                                        <Stack component="ol" sx={{ m: 0, pl: 2.5, mt: 0.5 }}>
                                            {[...(plantillaSel.pasos ?? [])]
                                                .filter((p) => p.activo)
                                                .sort((a, b) => a.orden - b.orden)
                                                .map((p) => (
                                                    <Typography key={p.id_paso} component="li" variant="body2">
                                                        {p.descr}
                                                    </Typography>
                                                ))}
                                        </Stack>
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                )}

                {fase === "exec" && checklist && (
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                            <Chip size="small" label={checklist.estado} color={checklist.estado === "Abierto" ? "warning" : "success"} />
                            {checklist.nombre_plantilla && (
                                <Chip size="small" variant="outlined" label={checklist.nombre_plantilla} />
                            )}
                            <Typography variant="body2" color="text.secondary">
                                Completados: {progreso.label}
                            </Typography>
                            {progreso.labelNoAplica && (
                                <Chip size="small" variant="outlined" label={progreso.labelNoAplica} />
                            )}
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={progreso.total ? (100 * progreso.resueltos) / progreso.total : 0}
                            sx={{ mb: 2, height: 8, borderRadius: 1 }}
                        />

                        <Stack spacing={2}>
                            {[...(checklist.pasos ?? [])]
                                .sort((a, b) => a.orden - b.orden)
                                .map((paso) => {
                                    const esNoAplica = paso.estado === "No Aplica"
                                    const esCompletado = paso.estado === "Completado"
                                    return (
                                    <Box
                                        key={paso.id_cpaso}
                                        sx={(theme) => ({
                                            p: 1.5,
                                            border: 1,
                                            borderColor: esNoAplica
                                                ? "action.disabled"
                                                : esCompletado
                                                    ? alpha(theme.palette.success.main, 0.4)
                                                    : "divider",
                                            borderRadius: 1,
                                            bgcolor: esNoAplica
                                                ? "action.hover"
                                                : esCompletado
                                                    ? alpha(theme.palette.success.main, 0.08)
                                                    : "background.paper",
                                            opacity: esNoAplica ? 0.55 : 1,
                                            transition: "opacity 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
                                        })}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                mb: 1,
                                                color: esNoAplica
                                                    ? "text.secondary"
                                                    : esCompletado
                                                        ? "success.main"
                                                        : "text.primary",
                                            }}
                                        >
                                            {paso.orden}. {paso.descr}
                                        </Typography>
                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                            <TextField
                                                select
                                                label="Estado"
                                                size="small"
                                                value={paso.estado}
                                                onChange={(e) => handleEstado(paso, e.target.value)}
                                                disabled={saving || checklist.estado !== "Abierto"}
                                                sx={{ minWidth: 160 }}
                                            >
                                                {ESTADOS.map((e) => (
                                                    <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
                                                ))}
                                            </TextField>
                                            <TextField
                                                label="Observación"
                                                size="small"
                                                fullWidth
                                                defaultValue={paso.observacion ?? ""}
                                                key={`${paso.id_cpaso}-${paso.observacion ?? ""}`}
                                                onBlur={(e) => {
                                                    const v = e.target.value
                                                    if ((paso.observacion ?? "") !== v) {
                                                        handleObs(paso, v || null)
                                                    }
                                                }}
                                                disabled={saving || checklist.estado !== "Abierto"}
                                            />
                                        </Stack>
                                    </Box>
                                    )
                                })}
                        </Stack>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>Cerrar ventana</Button>
                {fase === "pick" && (
                    <Button
                        variant="contained"
                        onClick={handleIniciar}
                        disabled={saving || !idPlantilla || plantillas.length === 0}
                    >
                        {saving ? <CircularProgress size={18} /> : "Iniciar checklist"}
                    </Button>
                )}
                {fase === "exec" && checklist?.estado === "Abierto" && (
                    <>
                        <Button color="inherit" onClick={handleCancelar} disabled={saving}>
                            Cancelar checklist
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleCerrar}
                            disabled={saving || !puedeCerrar}
                        >
                            {saving ? <CircularProgress size={18} /> : "Marcar como listo"}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    )
}
