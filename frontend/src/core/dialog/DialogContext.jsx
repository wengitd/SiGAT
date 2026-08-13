import React, { createContext, useContext, useState, useCallback } from "react";
import CustomDialog from "../../shared/ui/CustomDialog";

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
    const [dialogState, setDialogState] = useState({
        open: false,
        type: "confirm",
        severity: "primary",
        title: "",
        message: "",
        confirmText: undefined,
        cancelText: undefined,
        resolve: null,
    });

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            const opts = typeof options === "string" ? { message: options } : options;
            setDialogState({
                open: true,
                type: "confirm",
                severity: opts.severity || "warning",
                title: opts.title || "Confirmar acción",
                message: opts.message || "",
                confirmText: opts.confirmText || "Confirmar",
                cancelText: opts.cancelText || "Cancelar",
                resolve,
            });
        });
    }, []);

    const alert = useCallback((options) => {
        return new Promise((resolve) => {
            const opts = typeof options === "string" ? { message: options } : options;
            setDialogState({
                open: true,
                type: "alert",
                severity: opts.severity || "info",
                title: opts.title || "Notificación",
                message: opts.message || "",
                confirmText: opts.confirmText || "Aceptar",
                cancelText: undefined,
                resolve,
            });
        });
    }, []);

    const handleConfirm = () => {
        if (dialogState.resolve) {
            dialogState.resolve(true);
        }
        setDialogState((prev) => ({ ...prev, open: false, resolve: null }));
    };

    const handleCancel = () => {
        if (dialogState.resolve) {
            dialogState.resolve(false);
        }
        setDialogState((prev) => ({ ...prev, open: false, resolve: null }));
    };

    const handleClose = () => {
        if (dialogState.resolve) {
            dialogState.resolve(false);
        }
        setDialogState((prev) => ({ ...prev, open: false, resolve: null }));
    };

    return (
        <DialogContext.Provider value={{ confirm, alert }}>
            {children}
            <CustomDialog
                open={dialogState.open}
                type={dialogState.type}
                severity={dialogState.severity}
                title={dialogState.title}
                message={dialogState.message}
                confirmText={dialogState.confirmText}
                cancelText={dialogState.cancelText}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                onClose={handleClose}
            />
        </DialogContext.Provider>
    );
}

export function useDialog() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error("useDialog debe usarse dentro de un DialogProvider");
    }
    return context;
}
