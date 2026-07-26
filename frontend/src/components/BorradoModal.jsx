import { useEffect, useState } from "react"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, TextField, Typography } from "@mui/material"
import { registrarBorradoSolicitud } from "../services/solicitudBajaService"

/**
 * Modal para cerrar una solicitud de baja aprobada: registra el borrado
 * seguro de datos del activo y su acta de baja. El backend pasa el activo
 * a disponibilidad "De baja" al confirmar.
 */
export default function BorradoModal({ open, onClose, solicitud, onRegistrado }) {
    const [rutaActaBaja, setRutaActaBaja] = useState("")
    const [error, setError] = useState("")
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        if (!open) return
        setRutaActaBaja("")
        setError("")
    }, [open])

    async function guardar() {
        setGuardando(true)
        setError("")
        try {
            const actualizada = await registrarBorradoSolicitud(solicitud.id_solbaja, {
                ruta_acta_baja: rutaActaBaja || null,
            })
            onRegistrado?.(actualizada)
            onClose()
        } catch (err) {
            setError(err.response?.data?.detail ?? "Error al registrar el borrado")
        } finally {
            setGuardando(false)
        }
    }

    if (!solicitud) return null

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Registrar borrado seguro</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                {error && <Alert severity="error">{error}</Alert>}
                <Typography variant="body2" color="text.secondary">
                    Confirma que el borrado seguro de datos del activo ya se realizó.
                    El activo pasará a disponibilidad "De baja".
                </Typography>
                <TextField
                    label="Ruta del acta de baja (opcional)"
                    value={rutaActaBaja}
                    onChange={(e) => setRutaActaBaja(e.target.value)}
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button variant="contained" color="error" onClick={guardar} disabled={guardando}>
                    Registrar borrado
                </Button>
            </DialogActions>
        </Dialog>
    )
}
