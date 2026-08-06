import { createTheme } from "@mui/material/styles";

/*
  TEMA GLOBAL DE SIGAT
  ─────────────────────────────────────────────
  Aquí se define la identidad visual de toda la app:
  colores, tipografía y overrides de componentes MUI.

  Para cambiar cualquier color en toda la app, solo
  modificar este archivo. Los componentes lo heredan
  automáticamente via ThemeProvider en main.jsx.
*/

const theme = createTheme({
    // ── PALETA DE COLORES ──────────────────────────────
    palette: {
        primary: {
            main: "#1B6B5A",     // verde teal — sidebar, botones principales
            dark: "#0F3D30",     // hover del sidebar, estados activos
            light: "#4CAF8F",    // acentos, badges, chips
            contrastText: "#fff",
        },
        secondary: {
            main: "#1A2744",     // azul marino — encabezados oscuros
            contrastText: "#fff",
        },
        background: {
            default: "#F4F6F8",  // fondo general de la app
            paper: "#FFFFFF",    // cards, tablas, modales
        },
        text: {
            primary: "#1A2744",  // texto principal — navy
            secondary: "#6B7280", // texto secundario — gris
        },
        // Colores de estado para badges/chips
        success: { main: "#2E7D32" },
        warning: { main: "#ED6C02" },
        error: { main: "#E86046" },
        info: { main: "#0288D1" },
        verde_oscuro: {main:"#0B6E5E"},
        verde_claro: {main: "#2E9E8C"},
        
    },

    // ── TIPOGRAFÍA ─────────────────────────────────────
    // Inter: limpia, legible, estándar en dashboards modernos
    // JetBrains Mono: para IDs, números de serie, valores técnicos
    typography: {
        fontFamily: "'Inter', 'Roboto', sans-serif",
        h4: { fontWeight: 700 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
        body2: { color: "#6B7280" },
    },

    // ── FORMA (border radius global) ───────────────────
    shape: {
        borderRadius: 6,
    },

    // ── OVERRIDES DE COMPONENTES ───────────────────────
    // Aquí se personaliza cómo se ve cada componente MUI
    // sin tener que pasarle props en cada uso
    components: {
        // Botón principal — sin mayúsculas forzadas, con sombra suave
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 600,
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none" },
                },
            },
        },

        // Cards — sombra sutil, sin borde cuadrado
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    borderRadius: 12,
                },
            },
        },

        // Paper — misma sombra suave
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                },
            },
        },

        // TextField — borde más visible
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },

        // Chip — sin mayúsculas
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                    fontSize: "0.75rem",
                },
            },
        },
    },
});

export default theme;
