import { useEffect, useState, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import {
    Box, Button, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    MenuItem, Alert,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";

const ROLES = [
    { value: "editor", label: "Editor" },
    { value: "auditor", label: "Auditor" },
    { value: "admin", label: "Administrador" },
];

export default function UsuariosSistemaPage() {
    const { isAdmin, idUsuario } = useAuth();
    const { confirm, alert } = useDialog();

    const [usuarios, setUsuarios] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editando, setEditando] = useState(null); // usuario en edición, null = creando
    const [form, setForm] = useState({});
    const [error, setError] = useState(null);

    const fetchUsuarios = useCallback(() => {
        axiosClient.get("/usuario_sistema/").then((res) => setUsuarios(res.data));
    }, []);

    useEffect(() => {
        fetchUsuarios();
    }, [fetchUsuarios]);

    function abrirCrear() {
        setForm({ nombre: "", email: "", password: "", confirmarPassword: "", rol: "editor" });
        setEditando(null);
        setError(null);
        setOpenDialog(true);
    }

    function abrirEditar(usuario) {
        setForm({
            nombre: usuario.nombre,
            email: usuario.email,
            password: "",
            confirmarPassword: "",
            rol: usuario.rol,
        });
        setEditando(usuario);
        setError(null);
        setOpenDialog(true);
    }

    async function guardar() {
        if (!form.nombre?.trim()) {
            setError("El nombre es obligatorio");
            return;
        }
        if (!form.email?.trim()) {
            setError("El correo electrónico es obligatorio");
            return;
        }
        if (form.password && form.password !== form.confirmarPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }
        try {
            if (editando) {
                const payload = {
                    nombre: form.nombre.trim(),
                    email: form.email.trim(),
                    rol: form.rol,
                };
                if (form.password) payload.password = form.password;
                await axiosClient.put(`/usuario_sistema/${editando.id_usuario}`, payload);
            } else {
                if (!form.password) return setError("La contraseña es obligatoria");
                await axiosClient.post("/usuario_sistema/", {
                    nombre: form.nombre.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    rol: form.rol,
                });
            }
            setOpenDialog(false);
            fetchUsuarios();
        } catch (err) {
            setError(err.response?.data?.detail ?? "Error al guardar el usuario.");
        }
    }

    async function toggleVigente(usuario) {
        const accion = usuario.vigente ? "desactivar" : "activar";
        const ok = await confirm({
            title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
            message: `¿Estás seguro que quieres ${accion} a ${usuario.nombre} en el sistema?`,
            severity: usuario.vigente ? "warning" : "info",
            confirmText: accion.charAt(0).toUpperCase() + accion.slice(1),
        });
        if (!ok) return;
        try {
            if (usuario.vigente) {
                await axiosClient.delete(`/usuario_sistema/${usuario.id_usuario}`);
            } else {
                await axiosClient.put(`/usuario_sistema/${usuario.id_usuario}`, { vigente: true });
            }
            fetchUsuarios();
        } catch (err) {
            await alert({
                title: "Error de operación",
                message: err.response?.data?.detail ?? `Error al ${accion} el usuario.`,
                severity: "error",
            });
        }
    }

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                    <Typography variant="h5">Usuarios del Sistema</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Cuentas con acceso a la plataforma SiGAT y asignación de roles.
                    </Typography>
                </Box>
                {isAdmin && (
                    <Button variant="contained" onClick={abrirCrear}>Agregar usuario</Button>
                )}
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell style={{ width: 40 }}></TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Correo electrónico</TableCell>
                            <TableCell>Rol</TableCell>
                            {isAdmin && <TableCell align="right">Acciones</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {usuarios.map((u) => (
                            <TableRow key={u.id_usuario}>
                                <TableCell>
                                    <span style={{
                                        display: "inline-block", width: 10, height: 10, borderRadius: "50%",
                                        background: u.vigente ? "#4caf50" : "#f44336",
                                        verticalAlign: "middle",
                                    }} title={u.vigente ? "Usuario Activo" : "Usuario Inactivo"} />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{u.nombre}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        label={u.rol === "admin" ? "Administrador" : u.rol === "editor" ? "Editor" : "Auditor"}
                                        color={u.rol === "admin" ? "primary" : u.rol === "editor" ? "secondary" : "default"}
                                    />
                                </TableCell>
                                {isAdmin && (
                                    <TableCell align="right">
                                        <Button size="small" variant="outlined" onClick={() => abrirEditar(u)}>Editar</Button>
                                        {u.id_usuario !== idUsuario && (
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

                    <TextField
                        label="Nombre Completo"
                        value={form.nombre ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                        required
                    />

                    <TextField
                        label="Correo Electrónico"
                        type="email"
                        value={form.email ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        required
                    />

                    <TextField
                        select label="Rol del sistema" value={form.rol ?? "editor"}
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
                        required={!editando}
                    />
                    {(!editando || form.password) && (
                        <TextField
                            label="Confirmar contraseña"
                            type="password"
                            value={form.confirmarPassword ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, confirmarPassword: e.target.value }))}
                            required={!editando || !!form.password}
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
