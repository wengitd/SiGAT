import { Navigate } from "react-router-dom";
import { useAuth } from "../../core/auth/AuthContext";

/*
  Componente ProtectedRoute — protege rutas por autenticación y por roles permitidos.

  Props:
    allowedRoles?: Array<"Admin" | "Editor" | "Auditor"> | string

    children: contenido a proteger
    allowedRoles: lista de roles que tienen permisos
    requieredRole: rol especifico requerido.

*/
export default function ProtectedRoute({ children, allowedRoles, requiredRole }) {
    const { token, rol } = useAuth();

    if (!token) return <Navigate to="/login" replace />;

    /*permite arrays o solo el rol */
    const rolesList = allowedRoles
        ? Array.isArray(allowedRoles)
            ? allowedRoles
            : [allowedRoles]
        : requiredRole
            ? [requiredRole, "Admin"]
            : null;

    if (rolesList && !rolesList.includes(rol)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
