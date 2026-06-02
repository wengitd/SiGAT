import { Navigate } from "react-router-dom"; /* Componente de React para redirigir */
import { useAuth } from "../context/AuthContext"; /* Se importa el Hook para acceder al token */

/* Se define el componente
   Se recibe children, como pagina que va dentro a proteger */
export default function ProtectedRoute({ children }) {

    const { token } = useAuth();

    /* Si no hay token redirige al Login*/
    if (!token) return <Navigate to="/login" />;

    return children;
}

