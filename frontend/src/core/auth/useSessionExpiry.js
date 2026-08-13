import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { getTokenExpiryMs } from "./jwt";
import axiosClient from "../http/axiosClient";

const WARNING_MINUTES = Number(import.meta.env.VITE_SESSION_WARNING_MINUTES) || 5;
const IDLE_MINUTES = Number(import.meta.env.VITE_SESSION_IDLE_MINUTES) || 30;
const WARNING_MS = WARNING_MINUTES * 60_000;
const IDLE_MS = Math.max(IDLE_MINUTES * 60_000, WARNING_MS + 60_000);
const ACTIVITY_THROTTLE_MS = 1000;
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

export default function useSessionExpiry() {
    const { token, login, logout } = useAuth();
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = useState(false);
    const [expiryMs, setExpiryMs] = useState(null);

    const lastActivityMsRef = useRef(Date.now());
    const showWarningRef = useRef(false);
    const tokenRef = useRef(token);
    const hadTokenRef = useRef(false);
    const renewingRef = useRef(false);
    const warnTimerRef = useRef(null);
    const expireTimerRef = useRef(null);
    const lastThrottleRef = useRef(0);
    const expireNowRef = useRef(() => {});
    const scheduleIdleTimersRef = useRef(() => {});

    useEffect(() => {
        showWarningRef.current = showWarning;
    }, [showWarning]);

    useEffect(() => {
        tokenRef.current = token;
    }, [token]);

    const clearIdleTimers = useCallback(() => {
        if (warnTimerRef.current) {
            clearTimeout(warnTimerRef.current);
            warnTimerRef.current = null;
        }
        if (expireTimerRef.current) {
            clearTimeout(expireTimerRef.current);
            expireTimerRef.current = null;
        }
    }, []);

    const expireNow = useCallback(() => {
        clearIdleTimers();
        setShowWarning(false);
        setExpiryMs(null);
        logout();
        navigate("/login?reason=expired", { replace: true });
    }, [clearIdleTimers, logout, navigate]);

    const scheduleIdleTimers = useCallback(() => {
        clearIdleTimers();

        const idleExpireAt = lastActivityMsRef.current + IDLE_MS;
        const warnAt = idleExpireAt - WARNING_MS;
        setExpiryMs(idleExpireAt);

        const now = Date.now();
        if (now >= idleExpireAt) {
            expireNow();
            return;
        }

        if (now >= warnAt) {
            setShowWarning(true);
        } else {
            setShowWarning(false);
            warnTimerRef.current = setTimeout(() => setShowWarning(true), warnAt - now);
        }

        expireTimerRef.current = setTimeout(expireNow, idleExpireAt - now);
    }, [clearIdleTimers, expireNow]);

    useEffect(() => {
        expireNowRef.current = expireNow;
        scheduleIdleTimersRef.current = scheduleIdleTimers;
    }, [expireNow, scheduleIdleTimers]);

    const silentRenewIfNeeded = useCallback(async () => {
        const currentToken = tokenRef.current;
        if (!currentToken || renewingRef.current) return;

        const tokenExpiryMs = getTokenExpiryMs(currentToken);
        if (!tokenExpiryMs) return;
        if (tokenExpiryMs - Date.now() > WARNING_MS) return;

        renewingRef.current = true;
        try {
            const { data } = await axiosClient.post("/auth/renew");
            login(data.access_token);
        } catch {
            const stillValid = getTokenExpiryMs(tokenRef.current);
            if (!stillValid || stillValid <= Date.now()) {
                expireNow();
            }
        } finally {
            renewingRef.current = false;
        }
    }, [login, expireNow]);

    const onActivity = useCallback(() => {
        if (showWarningRef.current) return;

        const now = Date.now();
        if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) return;
        lastThrottleRef.current = now;
        lastActivityMsRef.current = now;
        scheduleIdleTimers();
        void silentRenewIfNeeded();
    }, [scheduleIdleTimers, silentRenewIfNeeded]);

    /** Reinicia el reloj de inactividad tras extender la sesión manualmente. */
    const markExtended = useCallback(() => {
        lastActivityMsRef.current = Date.now();
        lastThrottleRef.current = Date.now();
        setShowWarning(false);
        scheduleIdleTimers();
    }, [scheduleIdleTimers]);

    // Arranque / logout: el renew silencioso no debe reiniciar el idle
    useEffect(() => {
        if (!token) {
            hadTokenRef.current = false;
            clearIdleTimers();
            setShowWarning(false);
            setExpiryMs(null);
            return;
        }

        const tokenExpiryMs = getTokenExpiryMs(token);
        if (!tokenExpiryMs || Date.now() >= tokenExpiryMs) {
            expireNow();
            return;
        }

        if (!hadTokenRef.current) {
            hadTokenRef.current = true;
            lastActivityMsRef.current = Date.now();
            scheduleIdleTimers();
        }
    }, [token, clearIdleTimers, expireNow, scheduleIdleTimers]);

    // Listeners de actividad y visibilidad de pestaña
    useEffect(() => {
        if (!token) return;

        const opts = { passive: true };
        for (const event of ACTIVITY_EVENTS) {
            window.addEventListener(event, onActivity, opts);
        }

        function onVisible() {
            if (document.visibilityState !== "visible") return;

            const tokenExpiryMs = getTokenExpiryMs(tokenRef.current);
            if (!tokenExpiryMs || Date.now() >= tokenExpiryMs) {
                expireNowRef.current();
                return;
            }

            const idleExpireAt = lastActivityMsRef.current + IDLE_MS;
            const warnAt = idleExpireAt - WARNING_MS;
            const now = Date.now();

            if (now >= idleExpireAt) {
                expireNowRef.current();
            } else if (now >= warnAt) {
                setExpiryMs(idleExpireAt);
                setShowWarning(true);
            } else {
                scheduleIdleTimersRef.current();
            }
        }

        document.addEventListener("visibilitychange", onVisible);

        return () => {
            for (const event of ACTIVITY_EVENTS) {
                window.removeEventListener(event, onActivity, opts);
            }
            document.removeEventListener("visibilitychange", onVisible);
            // No limpiar timers aquí: un renew actualiza `token` y re-montaría el efecto
        };
    }, [token, onActivity]);

    // Limpieza al desmontar el modal/hook
    useEffect(() => () => clearIdleTimers(), [clearIdleTimers]);

    return { showWarning, expiryMs, markExtended };
}
