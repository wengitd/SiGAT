/**
 * Fuente única de rutas + meta de navegación (roles, label, icon).
 */
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory2";
import HistoryIcon from "@mui/icons-material/History";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import ApartmentIcon from "@mui/icons-material/Apartment";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import LoginPage from "../features/auth/pages/LoginPage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import InventarioPage from "../features/inventario/pages/InventarioPage";
import TrazabilidadPage from "../features/trazabilidad/pages/TrazabilidadPage";
import LicenciasPage from "../features/licencias/pages/LicenciasPage";
import SolicitudesBajaPage from "../features/solicitudes-baja/pages/SolicitudesBajaPage";
import UsuariosSistemaPage from "../features/usuarios/pages/UsuariosSistemaPage";
import MantenedorPage from "../features/catalogos/pages/MantenedorPage";
import DepartamentosPage from "../features/organizacion/pages/DepartamentosPage";
import EmpleadosPage from "../features/empleados/pages/EmpleadosPage";

/** Rutas de la app con metadatos de nav/roles. */
export const appRoutes = [
  {
    path: "/login",
    element: LoginPage,
    public: true,
  },
  {
    path: "/dashboard",
    element: DashboardPage,
    nav: { label: "Dashboard", icon: DashboardIcon },
  },
  {
    path: "/inventario",
    element: InventarioPage,
    nav: { label: "Inventario", icon: InventoryIcon },
  },
  {
    path: "/trazabilidad",
    element: TrazabilidadPage,
    nav: { label: "Trazabilidad", icon: HistoryIcon },
  },
  {
    path: "/licencias",
    element: LicenciasPage,
    nav: { label: "Licencias", icon: VerifiedUserIcon },
  },
  {
    path: "/solicitudes-baja",
    element: SolicitudesBajaPage,
    nav: { label: "Solicitudes de baja", icon: DeleteOutlineIcon },
  },
  {
    path: "/configuracion",
    element: UsuariosSistemaPage,
    roles: ["Admin"],
    navGroup: "Configuración",
    nav: { label: "Usuarios del sistema", icon: AdminPanelSettingsIcon },
  },
  {
    path: "/mantenedor",
    element: MantenedorPage,
    roles: ["Admin", "Editor"],
    navGroup: "Configuración",
    nav: { label: "Mantenedor", icon: LibraryBooksIcon },
  },
  {
    path: "/departamentos",
    element: DepartamentosPage,
    navGroup: "Configuración",
    nav: { label: "Departamentos", icon: ApartmentIcon },
  },
  {
    path: "/empleados",
    element: EmpleadosPage,
    navGroup: "Configuración",
    nav: { label: "Empleados", icon: PersonIcon },
  },
];

export const legacyRedirects = [
  { from: "/activos/computacionales", to: "/inventario" },
  { from: "/activos/perifericos", to: "/inventario" },
  { from: "/activos/nuevoActivo", to: "/inventario" },
];

/**
 * Construye ítems de sidebar según rol.
 * @param {{ isAdmin: boolean, isEditor: boolean }} auth
 */
export function buildNavItems({ isAdmin, isEditor }) {
  const top = [];
  const configChildren = [];

  function canAccess(route) {
    if (!route.roles?.length) return true;
    return route.roles.some((role) => {
      if (role === "Admin") return isAdmin;
      if (role === "Editor") return isEditor;
      return false;
    });
  }

  for (const route of appRoutes) {
    if (!route.nav || !canAccess(route)) continue;

    const item = {
      label: route.nav.label,
      icon: route.nav.icon,
      path: route.path,
    };

    if (route.navGroup === "Configuración") {
      configChildren.push(item);
    } else {
      top.push(item);
    }
  }

  if (configChildren.length > 0) {
    top.push({
      label: "Configuración",
      icon: SettingsIcon,
      children: configChildren,
    });
  }

  return top;
}
