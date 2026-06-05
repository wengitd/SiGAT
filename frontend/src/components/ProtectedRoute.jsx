import { Navigate } from "react-router-dom";
import { useAuth }   from "../context/AuthContext";

/*
  ProtectedRoute — protege rutas por autenticación y opcionalmente por rol.

  Props:
    requiredRole?: "editor" | "auditor"
      Si se indica, solo ese rol puede acceder.
      Sin prop, cualquier usuario autenticado puede entrar.
*/
export default function ProtectedRoute({ children, requiredRole }) {
  const { token, rol } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  if (requiredRole && rol !== requiredRole)
    return <Navigate to="/dashboard" replace />;

  return children;
}

