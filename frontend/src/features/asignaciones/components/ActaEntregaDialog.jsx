import { useState, useEffect, useRef } from "react"
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, CircularProgress, IconButton,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import UploadFileIcon from "@mui/icons-material/UploadFile"

import { useDialog } from "../../../core/dialog/DialogContext"
import { fetchActaBlob, fetchActaBlobUrl, replaceActa, uploadActa } from "../api"
import { useAuth } from "../../../core/auth/AuthContext"
import { ACTA_ACCEPT, esArchivoActaValido, esImagenActa, esPdfActa } from "../actaFileUtils"

const PREVIEW_SX = {
    width: "100%",
    height: { xs: 420, sm: 560 },
    border: 0,
    display: "block",
    bgcolor: "background.paper",
}

function mensajeError(err, fallback) {
    const detail = err.response?.data?.detail
    return typeof detail === "string" ? detail : fallback
}

/**
 * Dialog para previsualizar, subir o reemplazar el acta de entrega (PDF o imagen).
 * Props: open, onClose, idAsig, onReemplazado?(asignacionActualizada)
 */
export default function ActaEntregaDialog({ open, onClose, idAsig, onReemplazado }) {
    const { isEditor } = useAuth()
    const { confirm, alert: showAlert } = useDialog()
    const fileInputRef = useRef(null)

    const [serverBlobUrl, setServerBlobUrl] = useState(null)
    const [serverMime, setServerMime] = useState(null)
    const [sinActa, setSinActa] = useState(false)
    const [pendingFile, setPendingFile] = useState(null)
    const [pendingBlobUrl, setPendingBlobUrl] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState(null)

    const previewUrl = pendingBlobUrl || serverBlobUrl
    const esAlta = sinActa && !serverBlobUrl
    const mostrandoImagen = pendingFile
        ? esImagenActa(pendingFile)
        : Boolean(serverMime?.startsWith("image/"))

    function limpiarPendiente() {
        setPendingFile(null)
        setPendingBlobUrl(prev => {
            if (prev) URL.revokeObjectURL(prev)
            return null
        })
    }

    useEffect(() => {
        if (!open) {
            limpiarPendiente()
            setServerBlobUrl(prev => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
            setServerMime(null)
            setSinActa(false)
            setCargando(false)
            setError(null)
            return
        }

        limpiarPendiente()
        if (!idAsig) return

        let cancelled = false
        let createdUrl = null

        async function cargar() {
            setCargando(true)
            setError(null)
            setSinActa(false)
            setServerBlobUrl(prev => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
            setServerMime(null)
            try {
                const { url, mime } = await fetchActaBlob(idAsig)
                createdUrl = url
                if (!cancelled) {
                    setServerBlobUrl(url)
                    setServerMime(mime)
                    setSinActa(false)
                } else {
                    URL.revokeObjectURL(url)
                }
            } catch (err) {
                if (!cancelled) {
                    if (err.response?.status === 404) {
                        setSinActa(true)
                        setError(null)
                    } else {
                        setError(mensajeError(err, "No se pudo cargar el acta"))
                    }
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
    }, [open, idAsig])

    function handleFileSelected(e) {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return

        if (!esArchivoActaValido(file)) {
            showAlert({
                title: "Archivo inválido",
                message: "Solo se permiten archivos PDF, JPG, PNG o WEBP",
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

    async function handleConfirmarGuardado() {
        if (!pendingFile || !idAsig) return

        const ok = await confirm(esAlta
            ? {
                title: "Subir acta",
                message: `¿Confirmas subir "${pendingFile.name}" como acta de entrega?`,
                severity: "info",
                confirmText: "Subir",
            }
            : {
                title: "Reemplazar acta",
                message: `¿Confirmas reemplazar el acta por "${pendingFile.name}"?`,
                severity: "warning",
                confirmText: "Reemplazar",
            })
        if (!ok) return

        setGuardando(true)
        try {
            const actualizada = esAlta
                ? await uploadActa(idAsig, pendingFile)
                : await replaceActa(idAsig, pendingFile)
            const nuevaUrl = await fetchActaBlobUrl(idAsig)
            setServerBlobUrl(prev => {
                if (prev) URL.revokeObjectURL(prev)
                return nuevaUrl
            })
            setServerMime(pendingFile.type || null)
            setSinActa(false)
            limpiarPendiente()
            setError(null)
            onReemplazado?.(actualizada)
        } catch (err) {
            await showAlert({
                title: esAlta ? "Error al subir" : "Error al reemplazar",
                message: mensajeError(err, esAlta
                    ? "No se pudo subir el acta"
                    : "No se pudo reemplazar el acta"),
                severity: "error",
            })
        } finally {
            setGuardando(false)
        }
    }

    const usarImagen = mostrandoImagen || (pendingFile && !esPdfActa(pendingFile))
    const etiquetaArchivo = pendingFile
        ? "Elegir otro archivo"
        : (esAlta ? "Subir acta" : "Reemplazar acta")

    return (
        <Dialog
            open={open}
            onClose={guardando ? undefined : onClose}
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
                    Acta de entrega
                </Typography>
                <IconButton onClick={onClose} size="small" disabled={guardando} aria-label="Cerrar">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
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
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {cargando && !pendingBlobUrl && <CircularProgress />}
                    {!cargando && error && !pendingBlobUrl && (
                        <Box sx={{ p: 3 }}>
                            <Typography color="error">{error}</Typography>
                        </Box>
                    )}
                    {!cargando && sinActa && !pendingBlobUrl && !error && (
                        <Box sx={{ p: 3, textAlign: "center", maxWidth: 420 }}>
                            <Typography color="text.secondary">
                                Esta asignación no tiene acta de entrega. Sube un PDF o imagen.
                            </Typography>
                        </Box>
                    )}
                    {previewUrl && (!cargando || pendingBlobUrl) && (
                        usarImagen
                            ? (
                                <Box
                                    component="img"
                                    alt="Vista previa acta"
                                    src={previewUrl}
                                    sx={{
                                        ...PREVIEW_SX,
                                        objectFit: "contain",
                                        height: { xs: 420, sm: 560 },
                                    }}
                                />
                            )
                            : (
                                <Box
                                    component="iframe"
                                    title="Vista previa acta"
                                    src={previewUrl}
                                    sx={PREVIEW_SX}
                                />
                            )
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
                            disabled={guardando || cargando}
                        >
                            {etiquetaArchivo}
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            accept={ACTA_ACCEPT}
                            onChange={handleFileSelected}
                        />
                        {pendingFile && (
                            <>
                                <Button
                                    variant="contained"
                                    color={esAlta ? "primary" : "warning"}
                                    onClick={handleConfirmarGuardado}
                                    disabled={guardando}
                                >
                                    {guardando
                                        ? (esAlta ? "Subiendo…" : "Reemplazando…")
                                        : (esAlta ? "Confirmar subida" : "Confirmar reemplazo")}
                                </Button>
                                <Button
                                    onClick={limpiarPendiente}
                                    disabled={guardando}
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
                <Button onClick={onClose} disabled={guardando}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    )
}
