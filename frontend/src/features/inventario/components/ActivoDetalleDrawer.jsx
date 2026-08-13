import { useEffect, useState } from "react"
import {
    Drawer, Box, Typography, IconButton, Divider, Chip, Stack, Button, CircularProgress,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import BuildCircleIcon from "@mui/icons-material/BuildCircle"
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck"
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf"
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined"
import UploadFileIcon from "@mui/icons-material/UploadFile"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { useAuth } from "../../../core/auth/AuthContext"
import { getChecklistsPorActivo, resumenChecklist } from "../../checklist/api"
import ChecklistDetalleDialog from "../../checklist/components/ChecklistDetalleDialog"

function Fila({ label, valor }) {
    if (valor == null || valor === "") return null
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                {label}
            </Typography>
            <Typography variant="body2" component="div">{valor}</Typography>
        </Box>
    )
}

function Seccion({ titulo, children, ultima = false }) {
    return (
        <Box sx={{ mb: ultima ? 1 : 0 }}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
                {titulo}
            </Typography>
            <Stack spacing={1.5}>
                {children}
            </Stack>
            {!ultima && (
                <Divider sx={{ mt: 2.5, mb: 2.5, borderBottomWidth: 2, borderColor: "divider", opacity: 1 }} />
            )}
        </Box>
    )
}

const LABEL_PROPOSITO = {
    Preparacion: "Preparación",
    Reasignacion: "Reasignación",
}

const BOTON_ACTA_SX = { alignSelf: "flex-start", mt: 0.25 }

/** Texto o botón del acta según asignación, archivo existente y rol. */
function valorActaEntrega({ activo, isEditor, onVerActa }) {
    if (!activo.empleado_asignado && !activo.id_asig_actual) return "—"

    if (activo.tiene_acta_entr && activo.id_asig_actual) {
        return (
            <Button
                size="small"
                variant="outlined"
                startIcon={<DescriptionOutlinedIcon />}
                onClick={onVerActa}
                sx={BOTON_ACTA_SX}
            >
                Ver acta
            </Button>
        )
    }

    if (isEditor && onVerActa && activo.id_asig_actual) {
        return (
            <Button
                size="small"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={onVerActa}
                sx={BOTON_ACTA_SX}
            >
                Subir acta
            </Button>
        )
    }

    return "Sin acta"
}

/**
 * Panel lateral con el detalle completo de un activo.
 * Props: open, onClose, activo (fila del inventario o null), onPreparar(proposito), onVerFactura, onVerActa.
 */
export default function ActivoDetalleDrawer({ open, onClose, activo, onPreparar, onVerFactura, onVerActa }) {
    const { isEditor } = useAuth()
    const [checklists, setChecklists] = useState([])
    const [loadingChecks, setLoadingChecks] = useState(false)
    const [checklistDetalle, setChecklistDetalle] = useState(null)

    useEffect(() => {
        if (!open || !activo?.id_act) {
            setChecklists([])
            return
        }
        let cancelled = false
        setLoadingChecks(true)
        getChecklistsPorActivo(activo.id_act)
            .then((lista) => {
                if (!cancelled) {
                    const ordenada = [...(lista ?? [])].sort((a, b) => {
                        const fa = a.fecha_ini ?? ""
                        const fb = b.fecha_ini ?? ""
                        if (fa !== fb) return fb.localeCompare(fa)
                        return (b.id_check ?? 0) - (a.id_check ?? 0)
                    })
                    setChecklists(ordenada)
                }
            })
            .catch(() => {
                if (!cancelled) setChecklists([])
            })
            .finally(() => {
                if (!cancelled) setLoadingChecks(false)
            })
        return () => { cancelled = true }
    }, [open, activo?.id_act])

    if (!activo) {
        return (
            <Drawer anchor="right" open={open} onClose={onClose}>
                <Box sx={{ width: 520 }} />
            </Drawer>
        )
    }

    const esComputacional = activo.tipo === "Equipo Computo"
    const tipoLabel = esComputacional ? "Computacional" : "Periférico"
    const discoLabel = activo.disco_capac
        ? `${activo.disco_capac} ${activo.disco_unidad || ""}`.trim()
        : null
    const valorTecLabel = activo.valor_tec != null
        ? `${activo.valor_tec} ${activo.u_medida || ""}`.trim()
        : null

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                slotProps={{
                    paper: {
                        sx: {
                            width: { xs: "100%", sm: 520, md: 520, lg: 520 },
                            maxWidth: "100%",
                            borderTopLeftRadius: 12,
                            borderBottomLeftRadius: 12,
                        },
                    },
                }}
            >
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", p: 2.5, pb: 1.5 }}>
                    <Box>
                        <Typography variant="overline" color="text.secondary">
                            Activo #{activo.id_act}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                            {[activo.nombre_marca, activo.nombre_modelo].filter(Boolean).join(" ") || "Sin marca/modelo"}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                            <Chip label={tipoLabel} size="small" variant="outlined" />
                            <Chip
                                label={activo.nombre_dispo ?? "Sin datos"}
                                color={activo.dispo_color ?? "default"}
                                size="small"
                            />
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small" aria-label="Cerrar">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider sx={{ borderBottomWidth: 2, borderColor: "divider", opacity: 1 }} />

                <Box sx={{ p: 2.5, overflowY: "auto" }}>
                    <Seccion titulo="Datos generales">
                        <Fila label="Número de serie" valor={activo.num_serie} />
                        <Fila label="Origen" valor={activo.origen} />
                        <Fila label="Fecha de recepción" valor={activo.fecha_recep} />
                        <Fila label="Fecha emisión factura" valor={activo.fecha_em_fact} />
                        <Fila
                            label="Factura"
                            valor={activo.id_fact
                                ? (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        startIcon={<PictureAsPdfIcon />}
                                        onClick={onVerFactura}
                                        sx={{ alignSelf: "flex-start", mt: 0.25 }}
                                    >
                                        Ver PDF
                                    </Button>
                                )
                                : "—"}
                        />
                    </Seccion>

                    <Seccion titulo="Estado y asignación">
                        <Fila label="Condición" valor={activo.nombre_estado} />
                        <Fila label="Disponibilidad" valor={activo.nombre_dispo} />
                        <Fila label="Asignado a" valor={activo.empleado_asignado ?? "Sin asignar"} />
                        <Fila
                            label="Acta de entrega"
                            valor={valorActaEntrega({ activo, isEditor, onVerActa })}
                        />
                        {esComputacional && onPreparar && (
                            <Box>
                                {!activo.empleado_asignado ? (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<BuildCircleIcon />}
                                        onClick={() => onPreparar("Preparacion")}
                                    >
                                        Preparar equipo
                                    </Button>
                                ) : (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="warning"
                                        startIcon={<PlaylistAddCheckIcon />}
                                        onClick={() => onPreparar("Reasignacion")}
                                    >
                                        Preparar reasignación
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Seccion>

                    {esComputacional && (
                        <Seccion titulo="Preparación técnica">
                            {loadingChecks ? (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                                    <CircularProgress size={22} />
                                </Box>
                            ) : checklists.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    Sin checklists de preparación o reasignación.
                                </Typography>
                            ) : (
                                <Stack spacing={1.25}>
                                    {checklists.map((chk) => {
                                        const progreso = resumenChecklist(chk)
                                        return (
                                            <Box
                                                key={chk.id_check}
                                                sx={{
                                                    p: 1.25,
                                                    border: 1,
                                                    borderColor: "divider",
                                                    borderRadius: 1,
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {chk.nombre}
                                                </Typography>
                                                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                                                    <Chip
                                                        size="small"
                                                        label={LABEL_PROPOSITO[chk.proposito] ?? chk.proposito}
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        size="small"
                                                        label={chk.estado}
                                                        color={
                                                            chk.estado === "Cerrado"
                                                                ? "success"
                                                                : chk.estado === "Abierto"
                                                                    ? "warning"
                                                                    : "default"
                                                        }
                                                    />
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        label={`${progreso.label}${progreso.labelNoAplica ? ` · ${progreso.labelNoAplica}` : ""}`}
                                                    />
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                                                    {chk.fecha_ini ?? "—"}
                                                    {chk.fecha_ter ? ` → ${chk.fecha_ter}` : ""}
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    startIcon={<VisibilityIcon />}
                                                    onClick={() => setChecklistDetalle(chk)}
                                                    sx={{ mt: 0.5, px: 0 }}
                                                >
                                                    Ver detalle
                                                </Button>
                                            </Box>
                                        )
                                    })}
                                </Stack>
                            )}
                        </Seccion>
                    )}

                    {esComputacional ? (
                        <Seccion titulo="Datos técnicos — Computacional" ultima>
                            <Fila label="Tipo de equipo" valor={activo.nombre_tipoeq} />
                            <Fila label="Host name" valor={activo.host_name} />
                            <Fila label="Sistema operativo" valor={activo.nombre_so} />
                            <Fila label="CPU" valor={activo.cpu} />
                            <Fila label="RAM" valor={activo.ram_capac != null ? `${activo.ram_capac} GB` : null} />
                            <Fila label="Tipo RAM" valor={activo.ram_tipo} />
                            <Fila label="Disco" valor={discoLabel} />
                            <Fila label="Tipo disco" valor={activo.disco_tipo} />
                            <Fila label="MAC Ethernet" valor={activo.mac_ethernet} />
                            <Fila label="MAC Wi-Fi" valor={activo.mac_wifi} />
                        </Seccion>
                    ) : (
                        <Seccion titulo="Datos técnicos — Periférico" ultima>
                            <Fila label="Tipo de periférico" valor={activo.nombre_tipoper} />
                            <Fila label="Valor técnico" valor={valorTecLabel} />
                            <Fila label="Observaciones" valor={activo.obs_perif} />
                        </Seccion>
                    )}
                </Box>
            </Drawer>

            <ChecklistDetalleDialog
                open={!!checklistDetalle}
                onClose={() => setChecklistDetalle(null)}
                checklist={checklistDetalle}
            />
        </>
    )
}
