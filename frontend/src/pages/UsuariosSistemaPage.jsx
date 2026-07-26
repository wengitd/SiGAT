import { useEffect, useState, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Autocomplete, MenuItem, Alert,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "editor",  label: "Editor" },
  { value: "auditor", label: "Auditor" },
  { value: "admin",   label: "Admin" },
];

export default function UsuariosSistemaPage() {
  const { isEditor, idEmp } = useAuth();

  const [usuarios, setUsuarios]   = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editando, setEditando]     = useState(null); // usuario en edición, null = creando
  const [form, setForm]             = useState({});
  const [error, setError]           = useState(null);

  const fetchUsuarios = useCallback(() => {
    axiosClient.get("/usuario_sistema/").then((res) => setUsuarios(res.data));
  }, []);

  useEffect(() => {
    fetchUsuarios();
    axiosClient.get("/empleado/").then((res) => setEmpleados(res.data));
  }, [fetchUsuarios]);

  // empleados que todavía no tienen usuario del sistema
  const empleadosDisponibles = empleados.filter(
    (e) => e.operatividad && !usuarios.some((u) => u.id_emp === e.id_emp)
  );

  function abrirCrear() {
    setForm({ id_emp: "", password: "", confirmarPassword: "", rol: "editor" });
    setEditando(null);
    setError(null);
    setOpenDialog(true);
  }

  function abrirEditar(usuario) {
    setForm({ password: "", confirmarPassword: "", rol: usuario.rol });
    setEditando(usuario);
    setError(null);
    setOpenDialog(true);
  }

  async function guardar() {
    if (form.password && form.password !== form.confirmarPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    try {
      if (editando) {
        const payload = { rol: form.rol };
        if (form.password) payload.password = form.password;
        await axiosClient.put(`/usuario_sistema/${editando.id_emp}`, payload);
      } else {
        if (!form.id_emp) return setError("Selecciona un empleado");
        if (!form.password) return setError("La contraseña es obligatoria");
        await axiosClient.post("/usuario_sistema/", {
          id_emp: form.id_emp,
          password: form.password,
          rol: form.rol,
        });
      }
      setOpenDialog(false);
      fetchUsuarios();
    } catch (err) {
      setError(err.response?.data?.detail ?? "Error al guardar.");
    }
  }

  async function toggleVigente(usuario) {
    const accion = usuario.vigente ? "desactivar" : "activar";
    if (!window.confirm(`¿Estás seguro que quieres ${accion} a este usuario?`)) return;
    try {
      if (usuario.vigente) {
        await axiosClient.delete(`/usuario_sistema/${usuario.id_emp}`);
      } else {
        await axiosClient.put(`/usuario_sistema/${usuario.id_emp}`, { vigente: true });
      }
      fetchUsuarios();
    } catch (err) {
      alert(err.response?.data?.detail ?? `Error al ${accion} el usuario.`);
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Usuarios del sistema</Typography>
        {isEditor && (
          <Button variant="contained" onClick={abrirCrear}>Agregar usuario</Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              {isEditor && <TableCell>Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id_emp}>
                <TableCell>
                  <span style={{
                    display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                    background: u.vigente ? "#4caf50" : "#f44336",
                    marginRight: 6, verticalAlign: "middle",
                  }} />
                </TableCell>
                <TableCell>{u.empleado.nombre}</TableCell>
                <TableCell>{u.empleado.email}</TableCell>
                <TableCell><Chip size="small" label={u.rol} /></TableCell>
                {isEditor && (
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => abrirEditar(u)}>Editar</Button>
                    {u.id_emp !== idEmp && (
                      <Button
                        size="small" variant="outlined" sx={{ ml: 1 }}
                        color={u.vigente ? "error" : "success"}
                        onClick={() => toggleVigente(u)}
                      >
                        {u.vigente ? "Desactivar" : "Activar"}
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editando ? "Editar usuario del sistema" : "Nuevo usuario del sistema"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {!editando && (
            <Autocomplete
              options={empleadosDisponibles}
              getOptionLabel={(e) => `${e.nombre} (${e.email})`}
              value={empleadosDisponibles.find((e) => e.id_emp === form.id_emp) ?? null}
              onChange={(_, value) => setForm((p) => ({ ...p, id_emp: value?.id_emp ?? "" }))}
              renderInput={(params) => <TextField {...params} label="Empleado" required />}
            />
          )}

          {editando && (
            <TextField label="Empleado" value={`${editando.empleado.nombre} (${editando.empleado.email})`} disabled />
          )}

          <TextField
            select label="Rol" value={form.rol ?? "editor"}
            onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}
          >
            {ROLES.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </TextField>

          <TextField
            label={editando ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
            type="password"
            value={form.password ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            helperText="Mínimo 8 caracteres"
          />
          {(!editando || form.password) && (
            <TextField
              label="Confirmar contraseña"
              type="password"
              value={form.confirmarPassword ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, confirmarPassword: e.target.value }))}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
