import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, Stack, Chip, Divider,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import { resumenChecklist } from "../api"

const LABEL_PROPOSITO = {
    Preparacion: "Preparación",
    Reasignacion: "Reasignación",
}

const LABEL_ESTADO_PASO = {
    Pendiente: "Pendiente",
    "En Proceso": "En proceso",
    Completado: "Completado",
    "No Aplica": "No aplica",
}

const COLOR_ESTADO_CHECK = {
    Abierto: "warning",
    Cerrado: "success",
    Cancelado: "default",
}

const COLOR_ESTADO_PASO = {
    Pendiente: "default",
    "En Proceso": "info",
    Completado: "success",
    "No Aplica": "default",
}

/**
 * Diálogo de solo lectura con el detalle histórico de un checklist.
 * No permite modificar estados ni observaciones.
 */
export default function ChecklistDetalleDialog({ open, onClose, checklist }) {
    if (!checklist) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>Detalle de checklist</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary">
                        Sin datos del checklist.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        )
    }

    const progreso = resumenChecklist(checklist)
    const propositoLabel = LABEL_PROPOSITO[checklist.proposito] ?? checklist.proposito ?? "—"
    const pasos = [...(checklist.pasos ?? [])].sort((a, b) => a.orden - b.orden)

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {checklist.nombre || `Checklist #${checklist.id_check}`}
            </DialogTitle>
            <DialogContent dividers>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                    <Chip size="small" label={propositoLabel} variant="outlined" />
                    <Chip
                        size="small"
                        label={checklist.estado}
                        color={COLOR_ESTADO_CHECK[checklist.estado] ?? "default"}
                    />
                    <Chip size="small" variant="outlined" label={`Completados: ${progreso.label}`} />
                    {progreso.labelNoAplica && (
                        <Chip size="small" variant="outlined" label={progreso.labelNoAplica} />
                    )}
                </Stack>

                <Stack spacing={0.5} sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Inicio: {checklist.fecha_ini ?? "—"}
                        {checklist.fecha_ter ? ` · Término: ${checklist.fecha_ter}` : ""}
                    </Typography>
                    {checklist.registrado_por && (
                        <Typography variant="body2" color="text.secondary">
                            Registrado por: {checklist.registrado_por}
                        </Typography>
                    )}
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {pasos.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        Este checklist no tiene pasos registrados.
                    </Typography>
                ) : (
                    <Stack spacing={1.5}>
                        {pasos.map((paso, idx) => {
                            const esNoAplica = paso.estado === "No Aplica"
                            const esCompletado = paso.estado === "Completado"
                            const key = paso.id_cpaso ?? `${paso.orden}-${idx}`
                            return (
                                <Box
                                    key={key}
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
                                        opacity: esNoAplica ? 0.7 : 1,
                                    })}
                                >
                                    <Stack
                                        direction="row"
                                        alignItems="flex-start"
                                        justifyContent="space-between"
                                        spacing={1}
                                        sx={{ mb: paso.observacion ? 1 : 0 }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                color: esNoAplica
                                                    ? "text.secondary"
                                                    : esCompletado
                                                        ? "success.main"
                                                        : "text.primary",
                                            }}
                                        >
                                            {paso.orden}. {paso.descr}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={LABEL_ESTADO_PASO[paso.estado] ?? paso.estado}
                                            color={COLOR_ESTADO_PASO[paso.estado] ?? "default"}
                                            variant={esNoAplica ? "outlined" : "filled"}
                                        />
                                    </Stack>
                                    {paso.observacion && (
                                        <Typography variant="body2" color="text.secondary">
                                            Observación: {paso.observacion}
                                        </Typography>
                                    )}
                                </Box>
                            )
                        })}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    )
}
