import {
    Drawer, Box, Typography, IconButton, Divider, Chip, Link, Stack, Button,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import BuildCircleIcon from "@mui/icons-material/BuildCircle"
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck"

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

/**
 * Panel lateral con el detalle completo de un activo.
 * Props: open, onClose, activo (fila del inventario o null), onPreparar(proposito).
 */
export default function ActivoDetalleDrawer({ open, onClose, activo, onPreparar }) {
    if (!activo) {
        return (
            <Drawer anchor="right" open={open} onClose={onClose}>
                <Box sx={{ width: 520 }} />
            </Drawer>
        )
    }

    const esComputacional = activo.tipo === "equipo_computo"
    const tipoLabel = esComputacional ? "Computacional" : "Periférico"
    const discoLabel = activo.disco_capac
        ? `${activo.disco_capac} ${activo.disco_unidad || ""}`.trim()
        : null
    const valorTecLabel = activo.valor_tec != null
        ? `${activo.valor_tec} ${activo.u_medida || ""}`.trim()
        : null

    return (
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
                    <Fila
                        label="Factura"
                        valor={activo.ruta_pdf_fact
                            ? <Link href={activo.ruta_pdf_fact} target="_blank" rel="noreferrer">Ver PDF</Link>
                            : "—"}
                    />
                </Seccion>

                <Seccion titulo="Estado y asignación">
                    <Fila label="Condición" valor={activo.nombre_estado} />
                    <Fila label="Disponibilidad" valor={activo.nombre_dispo} />
                    <Fila label="Asignado a" valor={activo.empleado_asignado ?? "Sin asignar"} />
                    {esComputacional && onPreparar && (
                        <Box>
                            {!activo.empleado_asignado ? (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<BuildCircleIcon />}
                                    onClick={() => onPreparar("preparacion")}
                                >
                                    Preparar equipo
                                </Button>
                            ) : (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<PlaylistAddCheckIcon />}
                                    onClick={() => onPreparar("reasignacion")}
                                >
                                    Preparar reasignación
                                </Button>
                            )}
                        </Box>
                    )}
                </Seccion>

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
    )
}
