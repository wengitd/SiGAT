import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "../api";
import { useEffect, useState, useCallback } from "react";
import {
    Box, Button, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    MenuItem, Alert,
} from "@mui/material";
import { useAuth } from "../../../core/auth/AuthContext";
import { useDialog } from "../../../core/dialog/DialogContext";

const ROLES = [
    { value: "Editor", label: "Editor" },
    { value: "Auditor", label: "Auditor" },
    { value: "Admin", label: "Administrador" },
];

const PASSWORD_MIN_LENGTH = 8;

function mensajeError(err, fallback) {
    const detail = err.response?.data?.detail;
    return typeof detail === "string" ? detail : fallback;
}

export default function UsuariosSistemaPage() {
    const { isAdmin, idUsuario } = useAuth();
    const { confirm, alert } = useDialog();

    const [usuarios, setUsuarios] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editando, setEditando] = useState(null); // usuario en edición, null = creando
    const [form, setForm] = useState({});
    const [error, setError] = useState(null);

    const fetchUsuarios = useCallback(() => {
        getUsuarios().then(setUsuarios);
    }, []);

    useEffect(() => {
        fetchUsuarios();
    }, [fetchUsuarios]);

    function abrirCrear() {
        setForm({ nombre: "", email: "", password: "", confirmarPassword: "", rol: "Editor" });
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
        if (!editando && !form.password) {
            setError("La contraseña es obligatoria");
            return;
        }
        if (form.password && form.password.length < PASSWORD_MIN_LENGTH) {
            setError("La contraseña debe tener al menos 8 caracteres");
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
                await updateUsuario(editando.id_usuario, payload);
            } else {
                await createUsuario({
                    nombre: form.nombre.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    rol: form.rol,
                });
            }
            setOpenDialog(false);
            fetchUsuarios();
        } catch (err) {
            setError(mensajeError(err, "Error al guardar el usuario."));
        }
    }

    async function toggleVigente(usuario) {
        // Soft-reactivación, o soft-desactivación cuando tiene historial
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
                await deleteUsuario(usuario.id_usuario);
            } else {
                await updateUsuario(usuario.id_usuario, { vigente: true });
            }
            fetchUsuarios();
        } catch (err) {
            await alert({
                title: "Error de operación",
                message: mensajeError(err, `Error al ${accion} el usuario.`),
                severity: "error",
            });
        }
    }

    async function eliminarUsuario(usuario) {
        // Hard delete: solo cuando no tiene asociaciones (puede_eliminar)
        const ok = await confirm({
            title: "Eliminar usuario",
            message: `¿Eliminar permanentemente a ${usuario.nombre}? Esta acción no se puede deshacer.`,
            severity: "warning",
            confirmText: "Eliminar",
        });
        if (!ok) return;
        try {
            await deleteUsuario(usuario.id_usuario);
            fetchUsuarios();
        } catch (err) {
            await alert({
                title: "Error de operación",
                message: mensajeError(err, "Error al eliminar el usuario."),
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
                                        label={u.rol === "Admin" ? "Administrador" : u.rol === "Editor" ? "Editor" : "Auditor"}
                                        color={u.rol === "Admin" ? "primary" : u.rol === "Editor" ? "secondary" : "default"}
                                    />
                                </TableCell>
                                {isAdmin && (
                                    <TableCell align="right">
                                        <Button size="small" variant="outlined" onClick={() => abrirEditar(u)}>Editar</Button>
                                        {u.id_usuario !== idUsuario && (
                                            u.vigente ? (
                                                u.puede_eliminar ? (
                                                    <Button
                                                        size="small" variant="outlined" sx={{ ml: 1 }}
                                                        color="error"
                                                        onClick={() => eliminarUsuario(u)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="small" variant="outlined" sx={{ ml: 1 }}
                                                        color="error"
                                                        onClick={() => toggleVigente(u)}
                                                    >
                                                        Desactivar
                                                    </Button>
                                                )
                                            ) : (
                                                <Button
                                                    size="small" variant="outlined" sx={{ ml: 1 }}
                                                    color="success"
                                                    onClick={() => toggleVigente(u)}
                                                >
                                                    Activar
                                                </Button>
                                            )
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editando ? "Editar usuario del sistema" : "Nuevo usuario del sistema"}</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        label="Nombre Completo"
                        value={form.nombre ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                        sx={{ mt: 1 }}
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
                        select label="Rol del sistema" value={form.rol ?? "Editor"}
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
                        error={Boolean(form.password) && form.password.length < PASSWORD_MIN_LENGTH}
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
