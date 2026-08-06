import { useState, useEffect, useRef } from "react"
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, CircularProgress, IconButton, TextField,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import UploadFileIcon from "@mui/icons-material/UploadFile"

import { useDialog } from "../context/DialogContext"
import { fetchFacturaPdfBlobUrl, replaceFacturaPdf } from "../services/facturaService"
import { useAuth } from "../context/AuthContext"

function hoy() {
    return new Date().toISOString().slice(0, 10)
}

const PREVIEW_SX = {
    width: "100%",
    height: { xs: 420, sm: 560 },
    border: 0,
    display: "block",
    bgcolor: "background.paper",
}

/**
 * Dialog para previsualizar y reemplazar el PDF de una factura.
 * Props: open, onClose, idFact, fechaEm?, onReemplazado?(facturaActualizada)
 */
export default function FacturaPdfDialog({ open, onClose, idFact, fechaEm, onReemplazado }) {
    const { isEditor } = useAuth()
    const { confirm, alert: showAlert } = useDialog()
    const fileInputRef = useRef(null)

    const [fechaEmEdit, setFechaEmEdit] = useState("")
    const [serverBlobUrl, setServerBlobUrl] = useState(null)
    const [pendingFile, setPendingFile] = useState(null)
    const [pendingBlobUrl, setPendingBlobUrl] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [reemplazando, setReemplazando] = useState(false)
    const [error, setError] = useState(null)

    const previewUrl = pendingBlobUrl || serverBlobUrl

    function limpiarPendiente() {
        setPendingFile(null)
        setPendingBlobUrl(prev => {
            if (prev) URL.revokeObjectURL(prev)
            return null
        })
    }

    useEffect(() => {
        if (!open) {
            setFechaEmEdit("")
            limpiarPendiente()
            setServerBlobUrl(prev => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
            setCargando(false)
            setError(null)
            return
        }

        setFechaEmEdit(fechaEm ? String(fechaEm).slice(0, 10) : "")
        limpiarPendiente()

        if (!idFact) return

        let cancelled = false
        let createdUrl = null

        async function cargar() {
            setCargando(true)
            setError(null)
            setServerBlobUrl(prev => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
            try {
                createdUrl = await fetchFacturaPdfBlobUrl(idFact)
                if (!cancelled) setServerBlobUrl(createdUrl)
                else URL.revokeObjectURL(createdUrl)
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.detail ?? "No se pudo cargar el PDF")
                }
            } finally {
                if (!cancelled) setCargando(false)
            }
        }

        cargar()
        return () => {
            cancelled = true
            if (createdUrl) URL.revokeObjectURL(createdUrl)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset al abrir/cambiar factura
    }, [open, idFact, fechaEm])

    function handleFileSelected(e) {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return

        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            showAlert({
                title: "Archivo inválido",
                message: "Solo se permiten archivos PDF",
                severity: "warning",
            })
            return
        }

        setPendingBlobUrl(prev => {
            if (prev) URL.revokeObjectURL(prev)
            return URL.createObjectURL(file)
        })
        setPendingFile(file)
        setError(null)
    }

    async function handleConfirmarReemplazo() {
        if (!pendingFile || !idFact) return

        const ok = await confirm({
            title: "Reemplazar factura",
            message: `¿Confirmas reemplazar el PDF por "${pendingFile.name}"${fechaEmEdit ? ` con fecha de emisión ${fechaEmEdit}` : ""}?`,
            severity: "warning",
            confirmText: "Reemplazar",
        })
        if (!ok) return

        setReemplazando(true)
        try {
            const actualizada = await replaceFacturaPdf(
                idFact,
                pendingFile,
                fechaEmEdit || null,
            )
            const nuevaUrl = await fetchFacturaPdfBlobUrl(idFact)
            setServerBlobUrl(prev => {
                if (prev) URL.revokeObjectURL(prev)
                return nuevaUrl
            })
            limpiarPendiente()
            if (actualizada?.fecha_em) {
                setFechaEmEdit(String(actualizada.fecha_em).slice(0, 10))
            }
            setError(null)
            onReemplazado?.(actualizada)
        } catch (err) {
            await showAlert({
                title: "Error al reemplazar",
                message: err.response?.data?.detail ?? "No se pudo reemplazar el PDF",
                severity: "error",
            })
        } finally {
            setReemplazando(false)
        }
    }

    const tituloFecha = fechaEmEdit || (fechaEm ? String(fechaEm).slice(0, 10) : null)

    return (
        <Dialog
            open={open}
            onClose={reemplazando ? undefined : onClose}
            maxWidth="md"
            fullWidth
            slotProps={{
                paper: {
                    sx: { borderRadius: 1, maxHeight: "92vh" },
                },
            }}
        >
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1, pb: 1.5 }}>
                <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
                    {tituloFecha ? `Factura — ${tituloFecha}` : "Factura"}
                </Typography>
                <IconButton onClick={onClose} size="small" disabled={reemplazando} aria-label="Cerrar">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                {isEditor && (
                    <TextField
                        label="Fecha emisión"
                        type="date"
                        size="small"
                        value={fechaEmEdit}
                        onChange={(e) => setFechaEmEdit(e.target.value)}
                        disabled={reemplazando}
                        sx={{ maxWidth: 240 }}
                        slotProps={{
                            inputLabel: { shrink: true },
                            htmlInput: { max: hoy() },
                        }}
                    />
                )}

                {pendingFile && (
                    <Typography variant="body2" color="text.secondary">
                        Nuevo archivo seleccionado: <strong>{pendingFile.name}</strong>
                    </Typography>
                )}

                <Box
                    sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        overflow: "hidden",
                        bgcolor: "grey.100",
                        minHeight: { xs: 420, sm: 560 },
                    }}
                >
                    {cargando && !pendingBlobUrl && (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: { xs: 420, sm: 560 } }}>
                            <CircularProgress />
                        </Box>
                    )}
                    {!cargando && error && !pendingBlobUrl && (
                        <Box sx={{ p: 3 }}>
                            <Typography color="error">{error}</Typography>
                        </Box>
                    )}
                    {previewUrl && (!cargando || pendingBlobUrl) && (
                        <Box
                            component="iframe"
                            title="Vista previa factura"
                            src={previewUrl}
                            sx={PREVIEW_SX}
                        />
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 2, py: 1.5, gap: 1, flexWrap: "wrap" }}>
                {isEditor ? (
                    <>
                        <Button
                            variant="outlined"
                            startIcon={<UploadFileIcon />}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={reemplazando || cargando}
                        >
                            {pendingFile ? "Elegir otro PDF" : "Reemplazar PDF"}
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            accept="application/pdf,.pdf"
                            onChange={handleFileSelected}
                        />
                        {pendingFile && (
                            <>
                                <Button
                                    variant="contained"
                                    color="warning"
                                    onClick={handleConfirmarReemplazo}
                                    disabled={reemplazando || !fechaEmEdit}
                                >
                                    {reemplazando ? "Reemplazando…" : "Confirmar reemplazo"}
                                </Button>
                                <Button
                                    onClick={limpiarPendiente}
                                    disabled={reemplazando}
                                >
                                    Cancelar selección
                                </Button>
                            </>
                        )}
                    </>
                ) : (
                    <span />
                )}
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose} disabled={reemplazando}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    )
}
