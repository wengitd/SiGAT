import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/*
  ProtectedRoute — protege rutas por autenticación y por roles permitidos.

  Props:
    allowedRoles?: Array<"admin" | "editor" | "auditor"> | string
*/
export default function ProtectedRoute({ children, allowedRoles, requiredRole }) {
    const { token, rol } = useAuth();

    if (!token) return <Navigate to="/login" replace />;

    const rolesList = allowedRoles
        ? Array.isArray(allowedRoles)
            ? allowedRoles
            : [allowedRoles]
        : requiredRole
            ? [requiredRole, "admin"]
            : null;

    if (rolesList && !rolesList.includes(rol)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
