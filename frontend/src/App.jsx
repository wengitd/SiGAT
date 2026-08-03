import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InventarioPage from "./pages/InventarioPage";
import EstadisticasPage from "./pages/EstadisticasPage";
import TrazabilidadPage from "./pages/TrazabilidadPage";
import UsuariosSistemaPage from "./pages/UsuariosSistemaPage";
import DepartamentosPage from "./pages/DepartamentosPage";
import EmpleadosPage from "./pages/EmpleadosPage";
import MantenedorPage from "./pages/MantenedorPage";
import SolicitudesBajaPage from "./pages/SolicitudesBajaPage";
import LicenciasPage from "./pages/LicenciasPage";

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
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/inventario" element={<InventarioPage />} />
                    {/* Rutas antiguas de Activos → Inventario unificado */}
                    <Route path="/activos/computacionales" element={<Navigate to="/inventario" replace />} />
                    <Route path="/activos/perifericos" element={<Navigate to="/inventario" replace />} />
                    <Route path="/activos/nuevoActivo" element={<Navigate to="/inventario" replace />} />
                    <Route path="/estadisticas" element={<EstadisticasPage />} />
                    <Route path="/trazabilidad" element={<TrazabilidadPage />} />
                    <Route path="/licencias" element={<LicenciasPage />} />
                    <Route path="/solicitudes-baja" element={<SolicitudesBajaPage />} />
                    
                    {/* Módulo Usuarios del Sistema: Exclusivo para Admin */}
                    <Route
                        path="/configuracion"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <UsuariosSistemaPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Módulo Mantenedor: Exclusivo para Admin y Editor */}
                    <Route
                        path="/mantenedor"
                        element={
                            <ProtectedRoute allowedRoles={["admin", "editor"]}>
                                <MantenedorPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Módulo Departamentos */}
                    <Route path="/departamentos" element={<DepartamentosPage />} />

                    {/* Módulo Empleados (Personal de la empresa) */}
                    <Route path="/empleados" element={<EmpleadosPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
