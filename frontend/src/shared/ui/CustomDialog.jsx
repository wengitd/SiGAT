import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Box,
    Typography,
    Zoom,
    IconButton,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import CloseIcon from "@mui/icons-material/Close";

const SEVERITY_CONFIG = {
    warning: {
        icon: WarningAmberRoundedIcon,
        color: "#ED6C02",
        bgColor: "#FFF4E5",
        buttonColor: "warning",
    },
    error: {
        icon: ErrorOutlineRoundedIcon,
        color: "#D32F2F",
        bgColor: "#FDE8E8",
        buttonColor: "error",
    },
    info: {
        icon: InfoOutlinedIcon,
        color: "#0288D1",
        bgColor: "#E5F6FD",
        buttonColor: "info",
    },
    success: {
        icon: CheckCircleOutlineRoundedIcon,
        color: "#2E7D32",
        bgColor: "#EDF7ED",
        buttonColor: "success",
    },
    primary: {
        icon: HelpOutlineRoundedIcon,
        color: "#1B6B5A",
        bgColor: "#E8F5F1",
        buttonColor: "primary",
    },
};

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Zoom ref={ref} {...props} />;
});

/**
 * Componente modal web personalizado para alertas y confirmaciones en SiGAT.
 */
export default function CustomDialog({
    open,
    type = "confirm", // "confirm" | "alert"
    severity = "primary", // "primary" | "warning" | "error" | "info" | "success"
    title,
    message,
    confirmText = type === "confirm" ? "Confirmar" : "Aceptar",
    cancelText = "Cancelar",
    onConfirm,
    onCancel,
    onClose,
}) {
    const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.primary;
    const IconComponent = config.icon;

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        if (onClose) onClose();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        if (onClose) onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            maxWidth="xs"
            fullWidth
            slots={{ transition: Transition }}
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 1,
                        padding: 1,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                    },
                },
                backdrop: {
                    sx: {
                        backdropFilter: "blur(4px)",
                        backgroundColor: "rgba(15, 23, 42, 0.4)",
                    },
                },
            }}
        >
            <IconButton
                aria-label="close"
                onClick={handleCancel}
                sx={{
                    position: "absolute",
                    right: 12,
                    top: 12,
                    color: (theme) => theme.palette.grey[400],
                    "&:hover": {
                        color: (theme) => theme.palette.grey[700],
                    },
                }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>

            <DialogTitle sx={{ textAlign: "center", pt: 3, pb: 1 }}>
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        backgroundColor: config.bgColor,
                        color: config.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 12px auto",
                    }}
                >
                    <IconComponent sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: "text.primary" }}>
                    {title || (type === "confirm" ? "Confirmar acción" : "Notificación")}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ textAlign: "center", pb: 2 }}>
                {message && (
                    <DialogContentText
                        sx={{
                            color: "text.secondary",
                            fontSize: "0.95rem",
                            lineHeight: 1.5,
                        }}
                    >
                        {message}
                    </DialogContentText>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, justifyContent: "center" }}>
                {type === "confirm" && (
                    <Button
                        onClick={handleCancel}
                        variant="outlined"
                        color="inherit"
                        fullWidth
                        sx={{
                            borderRadius: 1,
                            borderColor: "#E2E8F0",
                            color: "#64748B",
                            "&:hover": {
                                borderColor: "#CBD5E1",
                                backgroundColor: "#F8FAFC",
                            },
                        }}
                    >
                        {cancelText}
                    </Button>
                )}
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color={config.buttonColor}
                    autoFocus
                    fullWidth
                    sx={{
                        borderRadius: 1,
                        boxShadow: "none",
                        fontWeight: 600,
                        "&:hover": {
                            boxShadow: "none",
                        },
                    }}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
