import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

function parseJWT(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const payload = token ? parseJWT(token) : {};
  const rol     = payload.rol ?? null;   // "editor" | "auditor" | "admin" | null
  const isEditor  = rol === "editor" || rol === "admin";
  const isAuditor = rol === "auditor";
  const isAdmin   = rol === "admin";

  function login(newToken) {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem("token");
  }

  return (
    <AuthContext.Provider value={{ token, rol, isEditor, isAuditor, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}