import { createContext, useContext, useState } from "react";

/* contenedor global donde se guarda el token */
const AuthContext = createContext();

/* componente que envuelve la APP */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token")); /* funciones que modifican estado */ 
  /* Con el login exitoso llama a login */ 
  function login(newToken) {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem("token");
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* hook personalizado */ 
export function useAuth() {
  return useContext(AuthContext);
}