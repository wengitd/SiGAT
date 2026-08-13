import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";

import App from "./app/App.jsx";
import theme from "./core/theme/index.js";
import { AuthProvider } from "./core/auth/AuthContext";
import { DialogProvider } from "./core/dialog/DialogContext";

/*
  Orden de providers (de afuera hacia adentro):
  1. ThemeProvider  → tema MUI
  2. CssBaseline    → reset de estilos
  3. DialogProvider → alertas/confirmaciones
  4. AuthProvider   → JWT / roles
  5. App            → router + features
*/
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <DialogProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </DialogProvider>
        </ThemeProvider>
    </React.StrictMode>
);
