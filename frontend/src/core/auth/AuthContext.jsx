import { createContext, useContext, useEffect, useState } from "react";
import { parseJWT } from "./jwt";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("token"));

    useEffect(() => {
        function onStorage(e) {
            if (e.key === "token") setToken(e.newValue);
        }
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const payload = token ? parseJWT(token) : {};
    const rol = payload.rol ?? null;   // "Editor" | "Auditor" | "Admin" | null
    const idUsuario = payload.sub ? Number(payload.sub) : null;
    const nombreUsuario = payload.nombre ?? "";
    const emailUsuario = payload.email ?? "";

    const isAdmin = rol === "Admin";
    const isEditor = rol === "Editor" || rol === "Admin";
    const isAuditor = rol === "Auditor";

    function login(newToken) {
        setToken(newToken);
        localStorage.setItem("token", newToken);
    }

    function logout() {
        setToken(null);
        localStorage.removeItem("token");
    }

    return (
        <AuthContext.Provider
            value={{
                token,
                rol,
                idUsuario,
                nombreUsuario,
                emailUsuario,
                isEditor,
                isAuditor,
                isAdmin,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}