import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    Box, List, ListItemButton, ListItemIcon, ListItemText,
    Typography, Collapse, Divider, Chip, IconButton, Tooltip, Menu, MenuItem,
} from "@mui/material";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";

import { useAuth } from "../../core/auth/AuthContext";
import SessionExpiryModal from "../../shared/ui/SessionExpiryModal";
import { buildNavItems } from "../routes";

const SIDEBAR_BG = "#1A2744"; // azul marino
const SIDEBAR_HOVER = "#243357"; // hover suave
const SIDEBAR_ACTIVE = "#1B6B5A"; // verde teal — ítem seleccionado
const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const STORAGE_KEY = "sigat-sidebar-collapsed";


export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, isAdmin, isEditor, nombreUsuario, rol } = useAuth();

    const [openGroups, setOpenGroups] = useState({ Configuración: true });
    const [collapsed, setCollapsed] = useState(
        () => localStorage.getItem(STORAGE_KEY) === "1"
    );
    const [configMenuAnchor, setConfigMenuAnchor] = useState(null);

    const navItems = buildNavItems({ isAdmin, isEditor }).map((item) => ({
        ...item,
        icon: item.icon ? <item.icon /> : null,
        children: item.children?.map((child) => ({
            ...child,
            icon: child.icon ? <child.icon fontSize="small" /> : null,
        })),
    }));

    function toggleCollapsed() {
        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
            return next;
        });
        setConfigMenuAnchor(null);
    }

    function toggleGroup(label) {
        setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
    }

    function isActive(path) {
        return location.pathname === path;
    }

    function isGroupActive(children) {
        return children?.some((c) => location.pathname === c.path);
    }

    function handleLogout() {
        logout();
        navigate("/login");
    }

    function wrapTooltip(label, element) {
        if (!collapsed) return element;
        return (
            <Tooltip title={label} placement="right" arrow>
                {element}
            </Tooltip>
        );
    }

    const iconSx = collapsed
        ? { minWidth: 0, color: "inherit", justifyContent: "center" }
        : { minWidth: 36, color: "inherit" };

    return (
        <Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>

            {/* ── SIDEBAR ──────────────────────────────── */}
            <Box
                sx={{
                    width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
                    flexShrink: 0,
                    bgcolor: SIDEBAR_BG,
                    display: "flex",
                    flexDirection: "column",
                    py: 2,
                    overflow: "hidden",
                    transition: "width 0.2s ease",
                }}
            >
                {/* Nombre del sistema + toggle */}
                <Box
                    sx={{
                        px: collapsed ? 1 : 2,
                        mb: 2,
                        display: "flex",
                        flexDirection: collapsed ? "column" : "row",
                        alignItems: collapsed ? "center" : "flex-start",
                        justifyContent: collapsed ? "center" : "space-between",
                        gap: collapsed ? 1 : 0.5,
                    }}
                >
                    {collapsed ? (
                        <img src="/logos/logo-sin-circulo.png" width={"50"} alt="SiGAT" />
                    ) : (
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
                                <img src="/logos/logo-sin-circulo.png" alt="SiGAT" width={40} />
                                <Box sx={{ display: "flex", flexDirection: "column" }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                                        <Box component="span" sx={{ color: "#fff" }}>Si</Box>
                                        <Box component="span" sx={{ color: "primary.light" }}>GAT</Box>
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, fontSize: "0.5rem", color: "rgba(255,255,255,0.45)" }}>
                                        GESTIÓN DE ACTIVOS TI
                                    </Typography>
                                </Box>
                            </Box>

                            {nombreUsuario && (
                                <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                                        {nombreUsuario}
                                    </Typography>
                                    <Chip
                                        label={rol}
                                        size="small"
                                        sx={{
                                            height: 18,
                                            fontSize: "0.65rem",
                                            bgcolor: isAdmin ? "#3f51b5" : isEditor ? "#1976d2" : "#757575",
                                            color: "#fff",
                                            fontWeight: 700,
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    )}

                    <IconButton
                        onClick={toggleCollapsed}
                        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
                        size="small"
                        sx={{
                            color: "rgba(255,255,255,0.7)",
                            mt: collapsed ? 0 : 0.25,
                            "&:hover": { color: "#fff", bgcolor: SIDEBAR_HOVER },
                        }}
                    >
                        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </IconButton>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 1 }} />

                {/* Ítems de navegación */}
                <List sx={{ flexGrow: 1, px: collapsed ? 0.75 : 1 }}>
                    {navItems.map((item) => {
                        if (item.children) {
                            if (item.children.length === 0) return null;
                            const groupOpen = openGroups[item.label] ?? false;
                            const groupActive = isGroupActive(item.children);

                            if (collapsed) {
                                return (
                                    <Box key={item.label}>
                                        {wrapTooltip(
                                            item.label,
                                            <ListItemButton
                                                onClick={(e) => setConfigMenuAnchor(e.currentTarget)}
                                                sx={{
                                                    ...sxItem(false, groupActive),
                                                    justifyContent: "center",
                                                    px: 1,
                                                }}
                                            >
                                                <ListItemIcon sx={iconSx}>{item.icon}</ListItemIcon>
                                            </ListItemButton>
                                        )}
                                        <Menu
                                            anchorEl={configMenuAnchor}
                                            open={Boolean(configMenuAnchor)}
                                            onClose={() => setConfigMenuAnchor(null)}
                                            anchorOrigin={{ vertical: "top", horizontal: "right" }}
                                            transformOrigin={{ vertical: "top", horizontal: "left" }}
                                        >
                                            {item.children.map((child) => (
                                                <MenuItem
                                                    key={child.path}
                                                    selected={isActive(child.path)}
                                                    onClick={() => {
                                                        navigate(child.path);
                                                        setConfigMenuAnchor(null);
                                                    }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 36 }}>{child.icon}</ListItemIcon>
                                                    <ListItemText primary={child.label} />
                                                </MenuItem>
                                            ))}
                                        </Menu>
                                    </Box>
                                );
                            }

                            return (
                                <Box key={item.label}>
                                    <ListItemButton
                                        onClick={() => toggleGroup(item.label)}
                                        sx={sxItem(false, groupActive)}
                                    >
                                        <ListItemIcon sx={iconSx}>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.label} sx={{
                                            "& .MuiListItemText-primary": {
                                                fontSize: 14,
                                            },
                                        }} />
                                        {groupOpen
                                            ? <ExpandLessIcon sx={{ color: "#fff", fontSize: 18 }} />
                                            : <ExpandMoreIcon sx={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }} />
                                        }
                                    </ListItemButton>

                                    <Collapse in={groupOpen} timeout="auto" unmountOnExit>
                                        <List disablePadding>
                                            {item.children.map((child) => (
                                                <ListItemButton
                                                    key={child.path}
                                                    onClick={() => navigate(child.path)}
                                                    sx={{ ...sxItem(isActive(child.path), false), pl: 4 }}
                                                >
                                                    <ListItemIcon sx={iconSx}>{child.icon}</ListItemIcon>
                                                    <ListItemText primary={child.label} sx={{
                                                        "& .MuiListItemText-primary": {
                                                            fontSize: 13,
                                                        },
                                                    }} />
                                                </ListItemButton>
                                            ))}
                                        </List>
                                    </Collapse>
                                </Box>
                            );
                        }

                        const button = (
                            <ListItemButton
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    ...sxItem(isActive(item.path), false),
                                    ...(collapsed ? { justifyContent: "center", px: 1 } : {}),
                                }}
                            >
                                <ListItemIcon sx={iconSx}>{item.icon}</ListItemIcon>
                                {!collapsed && (
                                    <ListItemText primary={item.label} sx={{
                                        "& .MuiListItemText-primary": {
                                            fontSize: 14,
                                        },
                                    }}
                                    />
                                )}
                            </ListItemButton>
                        );

                        return collapsed
                            ? <Box key={item.path}>{wrapTooltip(item.label, button)}</Box>
                            : button;
                    })}
                </List>

                {/* Cerrar sesión — pegado al fondo */}
                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 1 }} />
                <Box sx={{ px: collapsed ? 0.75 : 1 }}>
                    {wrapTooltip(
                        "Cerrar sesión",
                        <ListItemButton
                            onClick={handleLogout}
                            sx={{
                                ...sxItem(false, false),
                                ...(collapsed ? { justifyContent: "center", px: 1 } : {}),
                            }}
                        >
                            <ListItemIcon sx={iconSx}><LogoutIcon /></ListItemIcon>
                            {!collapsed && (
                                <ListItemText primary="Cerrar sesión" sx={{
                                    "& .MuiListItemText-primary": {
                                        fontSize: 14,
                                    },
                                }}
                                />
                            )}
                        </ListItemButton>
                    )}
                </Box>
            </Box>

            {/* ── ÁREA DE CONTENIDO ────────────────────── */}
            <Box component="main" sx={{ flexGrow: 1, overflow: "auto", p: 3 }}>
                <Outlet />
            </Box>

            <SessionExpiryModal />
        </Box>
    );
}

function sxItem(active, groupActive) {
    return {
        borderRadius: 1,
        mb: 0.5,
        color: active ? "#fff" : "rgba(255,255,255,0.75)",
        bgcolor: active
            ? SIDEBAR_ACTIVE
            : groupActive
                ? "rgba(255, 255, 255, 0.08)"
                : "transparent",
        "&:hover": {
            bgcolor: active ? SIDEBAR_ACTIVE : SIDEBAR_HOVER,
            color: "#fff",
        },
        transition: "background-color 0.15s",
    };
}
