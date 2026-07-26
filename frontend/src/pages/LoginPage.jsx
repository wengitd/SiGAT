import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import { Box, Button, Container, TextField, Typography, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth(); /* Extrae la funcion login del contexto creado*/
  const navigate = useNavigate();

  /*funcion que maneja el submit del formulario */
  async function handleSubmit(e) {
    console.log("handleSubmit llamado");
  
    e.preventDefault(); /*evita que el formulario recargue la pagina al enviarse */
    setError(null); /*limpia cualquier error antes de intentar de nuevo */

    const formData = new FormData();
    formData.append("username", email); /*endpoint usa OAuth2.. que espera los datos como formulario y con campo llamado username */
    formData.append("password", password);

    /*llamada a la API */
    try {
      const response = await axiosClient.post("/auth/login", formData);
      console.log("RESPONSE:", response);
      console.log("DATA:", response.data);
      console.log("TOKEN:", response.data.access_token);
      
      login(response.data.access_token);
      console.log("token guardado, navegando...");

      navigate("/dashboard");
      console.log("navigate ejecutado");

    } catch (err) {
      console.log("Error en login:", err);
      console.log("ERROR RESPONSE:", err.response);
      setError(err.response?.data?.detail || "Credenciales incorrectas");
    }
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <Typography variant="h5">SiGAT</Typography>
        <Typography variant="body2" color="text.secondary">
          Sistema de Gestión de Activos Tecnológicos
        </Typography>
        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" fullWidth>
            Entrar
          </Button>
        </form>
      </Box>
    </Container>
  );
}