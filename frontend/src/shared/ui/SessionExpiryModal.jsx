import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../core/auth/AuthContext";
import { renewSession } from "../../features/auth/api";
import useSessionExpiry from "../../core/auth/useSessionExpiry";

function formatRemaining(ms) {
    const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function SessionExpiryModal() {
    const { showWarning, expiryMs, markExtended } = useSessionExpiry();
    const { login, logout } = useAuth();
    const navigate = useNavigate();
    const [remainingMs, setRemainingMs] = useState(0);
    const [error, setError] = useState("");
    const [renovando, setRenovando] = useState(false);

    useEffect(() => {
        if (!showWarning || !expiryMs) return;
        setError("");
        setRemainingMs(expiryMs - Date.now());
        const interval = setInterval(() => {
            setRemainingMs(expiryMs - Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, [showWarning, expiryMs]);

    async function extender() {
        setRenovando(true);
        setError("");
        try {
            const data = await renewSession();
            markExtended();
            login(data.access_token);
        } catch {
            setError("No se pudo extender la sesión. Vuelve a iniciar sesión.");
        } finally {
            setRenovando(false);
        }
    }

    function cerrarAhora() {
        logout();
        navigate("/login");
    }

    return (
        <Dialog open={showWarning} maxWidth="xs" fullWidth>
            <DialogTitle>Tu sesión está por expirar</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                {error && <Alert severity="error">{error}</Alert>}
                <Typography variant="body2" color="text.secondary">
                    Por inactividad, tu sesión se cerrará automáticamente en:
                </Typography>
                <Typography variant="h4" sx={{ textAlign: "center", fontWeight: 700 }}>
                    {formatRemaining(remainingMs)}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={cerrarAhora}>Cerrar sesión ahora</Button>
                <Button variant="contained" onClick={extender} disabled={renovando}>
                    {renovando ? "Extendiendo..." : "Extender sesión"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
