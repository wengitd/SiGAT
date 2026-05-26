import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import ActivosPage from "./pages/ActivosPage";
import EmpleadosPage from "./pages/EmpleadosPage";
import InventarioPage from "./pages/InventarioPage";


export default function App() {
   return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}> {/* wrapper */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/activos" element={<ActivosPage />} />
          <Route path="/empleados" element={<EmpleadosPage />} />
          <Route path="/inventario" element={<InventarioPage/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}