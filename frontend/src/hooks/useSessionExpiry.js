import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTokenExpiryMs } from "../utils/jwt";

const WARNING_MINUTES = Number(import.meta.env.VITE_SESSION_WARNING_MINUTES) || 5;

export default function useSessionExpiry() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = useState(false);
    const [expiryMs, setExpiryMs] = useState(null);

    useEffect(() => {
        setShowWarning(false);
        if (!token) return;

        const tokenExpiryMs = getTokenExpiryMs(token);
        setExpiryMs(tokenExpiryMs);
        if (!tokenExpiryMs) return;

        const warnAtMs = tokenExpiryMs - WARNING_MINUTES * 60_000;

        function expireNow() {
            setShowWarning(false);
            logout();
            navigate("/login?reason=expired", { replace: true });
        }

        // por si el efecto se dispara con un token que ya venció (ej. tab recién enfocada)
        if (Date.now() >= tokenExpiryMs) {
            expireNow();
            return;
        }
        if (Date.now() >= warnAtMs) setShowWarning(true);

        const warnTimer = setTimeout(() => setShowWarning(true), Math.max(warnAtMs - Date.now(), 0));
        const expireTimer = setTimeout(expireNow, Math.max(tokenExpiryMs - Date.now(), 0));

        // los setTimeout se pueden retrasar con la pestaña en segundo plano; al volver, recalcula
        function onVisible() {
            if (document.visibilityState !== "visible") return;
            if (Date.now() >= tokenExpiryMs) expireNow();
            else if (Date.now() >= warnAtMs) setShowWarning(true);
        }
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            clearTimeout(warnTimer);
            clearTimeout(expireTimer);
            document.removeEventListener("visibilitychange", onVisible);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return { showWarning, expiryMs };
}
