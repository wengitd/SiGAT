import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Collapse, Divider,
} from "@mui/material";

import DashboardIcon    from "@mui/icons-material/Dashboard";
import InventoryIcon    from "@mui/icons-material/Inventory2";
import ComputerIcon     from "@mui/icons-material/Computer";
import DevicesOtherIcon from "@mui/icons-material/DevicesOther";
import BarChartIcon     from "@mui/icons-material/BarChart";
import HistoryIcon      from "@mui/icons-material/History";
import SettingsIcon     from "@mui/icons-material/Settings";
import ExpandLessIcon   from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon   from "@mui/icons-material/ExpandMore";
import LogoutIcon       from "@mui/icons-material/Logout";
import ApartmentIcon    from '@mui/icons-material/Apartment';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import TuneIcon         from '@mui/icons-material/Tune';

import { useAuth } from "../context/AuthContext";

/*
  ESTRUCTURA DEL SIDEBAR
  ─────────────────────────────────────────────
  Cada ítem puede ser:
  - Un enlace directo (tiene `path`)
  - Un grupo con hijos (tiene `children`) → se colapsa/expande

  El sidebar resalta automáticamente el ítem activo
  comparando la ruta actual (useLocation) con cada path.
*/

const NAV_ITEMS = [
  {
    label: "Dashboard",
    icon: <DashboardIcon />,
    path: "/dashboard",
  },
  {
    label: "Inventario",
    icon: <InventoryIcon />,
    path: "/inventario",
  },
  {
    label: "Activos",
    icon: <ComputerIcon />,
    // Sin path → es un grupo colapsable
    children: [
      { label: "Computacionales", icon: <ComputerIcon fontSize="small" />, path: "/activos/computacionales" },
      { label: "Periféricos",     icon: <ComputerIcon fontSize="small" />, path: "/activos/perifericos" },
    ],
  },
  {
    label: "Estadísticas",
    icon: <BarChartIcon />,
    path: "/estadisticas",
  },
  {
    label: "Trazabilidad",
    icon: <HistoryIcon />,
    path: "/trazabilidad",
  },
  {
    label: "Configuración",
    icon: <SettingsIcon />,
    children: [
      { label: "Usuarios"  , icon: <SettingsIcon fontSize="small"/>, path:"/configuracion"},
      { label: "Parámetros", icon: <SettingsIcon fontSize="small"/>, path:""},
      //{label:"", icon: </>, path:""}
    ],
  },

  {
    label: "Parametrización",
    icon: <TuneIcon />,
    path: "/parametros",
  },

  {
    label: "Departamentos",
    icon: < ApartmentIcon/>,
    path: "/departamentos",
  },
  {
    label: "Colaboradores",
    icon: < ApartmentIcon/>,
    path: "/empleados",
  },
];

// Colores del sidebar
const SIDEBAR_BG     = "#1A2744"; // azul marino
const SIDEBAR_HOVER  = "#243357"; // hover suave
const SIDEBAR_ACTIVE = "#1B6B5A"; // verde teal — ítem seleccionado


export default function Layout() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { logout } = useAuth();

  // Controla qué grupos están abiertos (por defecto Equipos abierto)
  const [openGroups, setOpenGroups] = useState({ Equipos: true });

  function toggleGroup(label) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  // ¿La ruta actual es exactamente este path?
  function isActive(path) {
    return location.pathname === path;
  }

  // ¿Algún hijo del grupo está activo?
  function isGroupActive(children) {
    return children?.some((c) => location.pathname.startsWith(c.path));
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>

      {/* ── SIDEBAR ──────────────────────────────── */}
      <Box
        sx={{
          width: 240,
          flexShrink: 0,
          bgcolor: SIDEBAR_BG,
          display: "flex",
          flexDirection: "column",
          py: 2,
        }}
      >
        {/* Nombre del sistema */}
        <Box sx={{ px: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, letterSpacing: 1 }}>
            SiGAT
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>
            Gestión de Activos TI
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 1 }} />

        {/* Ítems de navegación */}
        <List sx={{ flexGrow: 1, px: 1 }}>
          {NAV_ITEMS.map((item) => {

            // ── Grupo colapsable (ej: Equipos) ──
            if (item.children) {
              const groupOpen   = openGroups[item.label] ?? false;
              const groupActive = isGroupActive(item.children);

              return (
                <Box key={item.label}>
                  <ListItemButton
                    onClick={() => toggleGroup(item.label)}
                    sx={sxItem(false, groupActive)}
                  >
                    <ListItemIcon sx={sxIcon}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} sx={{
                      "& .MuiListItemText-primary": {
                        fontSize: 14,
                      },
                    }}/>
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
                          <ListItemIcon sx={sxIcon}>{child.icon}</ListItemIcon>
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

            // ── Ítem directo ──
            return (
              <ListItemButton
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={sxItem(isActive(item.path), false)}
              >
                <ListItemIcon sx={sxIcon}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} sx={{"& .MuiListItemText-primary": {fontSize: 14,
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        {/* Cerrar sesión — pegado al fondo */}
        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 1 }} />
        <Box sx={{ px: 1 }}>
          <ListItemButton onClick={handleLogout} sx={sxItem(false, false)}>
            <ListItemIcon sx={sxIcon}><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Cerrar sesión" sx={{"& .MuiListItemText-primary": {fontSize: 14,
                },
              }} 
            />
          </ListItemButton>
        </Box>
      </Box>

      {/* ── ÁREA DE CONTENIDO ────────────────────── */}
      <Box component="main" sx={{ flexGrow: 1, overflow: "auto", p: 3 }}>
        {/*
          <Outlet /> es el "hueco" donde React Router renderiza
          la página que corresponde a la ruta actual.
          Ej: si estás en /inventario, aquí aparece <InventarioPage />.
        */}
        <Outlet />
      </Box>
    </Box>
  );
}

// ── HELPERS DE ESTILO ────────────────────────────────────

// Estilo dinámico de cada ítem según estado (activo / en grupo activo / normal)
function sxItem(active, groupActive) {
  return {
    borderRadius: 2,
    mb: 0.5,
    color: active ? "#fff" : "rgba(255,255,255,0.75)",
    bgcolor: active
      ? SIDEBAR_ACTIVE
      : groupActive
        ? "rgba(138, 52, 52, 0.05)"
        : "transparent",
    "&:hover": {
      bgcolor: active ? SIDEBAR_ACTIVE : SIDEBAR_HOVER,
      color: "#fff",
    },
    transition: "background-color 0.15s",
  };
}

// Íconos — heredan el color del ListItemButton padre
const sxIcon = {
  minWidth: 36,
  color: "inherit",
};
