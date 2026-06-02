import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";

import App from "./App.jsx";
import theme from "./theme/index.js";
import { AuthProvider } from "./context/AuthContext";

/*
  Orden de providers (de afuera hacia adentro):
  1. ThemeProvider  → aplica los colores e Inter a toda la app
  2. CssBaseline    → resetea estilos del navegador (margenes, fuentes)
  3. AuthProvider   → provee el token JWT a todos los componentes
  4. App            → el resto de la app (router, páginas)
*/
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);