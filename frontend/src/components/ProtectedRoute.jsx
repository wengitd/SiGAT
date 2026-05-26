import { Navigate } from "react-router-dom"; /*componente de react para redirigir */
import { useAuth } from "../context/AuthContext"; /*se importa el hook para acceder al token */

/*se define el componente
se recibe children, como pagina que va dentro a proteger */
export default function ProtectedRoute({ children }) {

    const { token } = useAuth();

    /*si no hay token redirige al login*/
    if (!token) return <Navigate to="/login" />;

    return children;
}

