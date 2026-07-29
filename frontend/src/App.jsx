import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import LoginPage           from "./pages/LoginPage";
import DashboardPage       from "./pages/DashboardPage";
import InventarioPage      from "./pages/InventarioPage";
import ComputacionalesPage from "./pages/activos/ComputacionalesPage";
import PerifericosPage     from "./pages/activos/PerifericosPage";
import EstadisticasPage    from "./pages/EstadisticasPage";
import TrazabilidadPage    from "./pages/TrazabilidadPage";
import UsuariosSistemaPage from "./pages/UsuariosSistemaPage";
import DepartamentosPage   from "./pages/DepartamentosPage";
import EmpleadosPage       from "./pages/EmpleadosPage";
import NuevoActivoPage     from "./pages/activos/NuevoActivoPage";
import MantenedorPage        from "./pages/MantenedorPage"
import SolicitudesBajaPage   from "./pages/SolicitudesBajaPage";


/*
  ESTRUCTURA DE RUTAS
  ─────────────────────────────────────────────
  /login                        > pantalla de acceso (pública)
  /                             > redirige a /dashboard
  /dashboard                    > resumen general
  /inventario                   > tabla de todos los activos
  /equipos/computacionales      > equipos de cómputo
  /equipos/perifericos          > equipos periféricos
  /estadisticas                 > gráficos e informes
  /trazabilidad                 > historial de estados
  /solicitudes-baja             > solicitar y resolver bajas de activos
  /configuracion                > catálogos y configuración
  /Departamentos                >
  /Activos                      >  

  Las rutas protegidas están dentro de <ProtectedRoute> + <Layout>.
  Si el usuario no tiene token, es redirigido a /login automáticamente.
*/

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Redirige la raíz al dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Rutas protegidas — todas comparten el Layout (sidebar + header) */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard"               element={<DashboardPage />} />
          <Route path="/inventario"              element={<InventarioPage />} />
          <Route path="/activos/computacionales" element={<ComputacionalesPage />} />
          <Route path="/activos/perifericos"     element={<PerifericosPage />} />
          <Route path="/activos/nuevoActivo"     element={<NuevoActivoPage />} />
          <Route path="/estadisticas"            element={<EstadisticasPage />} />
          <Route path="/trazabilidad"            element={<TrazabilidadPage />} />
          <Route path="/solicitudes-baja"        element={<SolicitudesBajaPage />} />
          <Route path="/configuracion"           element={<UsuariosSistemaPage />} />
          <Route path="/departamentos"           element={<DepartamentosPage />} />
          <Route path="/empleados"               element={<EmpleadosPage />} />
          <Route path="/mantenedor"              element={<MantenedorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
