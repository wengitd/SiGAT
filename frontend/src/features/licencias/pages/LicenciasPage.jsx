import { useEffect, useState } from "react";
import {
  getVersionesLicencia,
  getProveedoresLicencia,
  getAsignacionesLicencia as getAsignaciones,
  asignarLicencia,
  desasignarLicencia,
} from "../api";
import { getEmpleados } from "../../empleados/api";
import { useAuth } from "../../../core/auth/AuthContext";
import { useDialog } from "../../../core/dialog/DialogContext";
import {
    Box, Button, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Autocomplete, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
} from "@mui/material";

function etiquetaVersion(ver, proveedoresById) {
    const proveedor = proveedoresById.get(ver.id_prov) ?? "Proveedor";
    return `${proveedor} — ${ver.nombre}`;
}

export default function LicenciasPage() {
    const { isEditor } = useAuth();
    const { confirm, alert: showAlert } = useDialog();

    const [empleados, setEmpleados] = useState([]);
    const [empleado, setEmpleado] = useState(null);
    const [asignaciones, setAsignaciones] = useState([]);
    const [versiones, setVersiones] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [catalogoError, setCatalogoError] = useState("");

    const [openAsignar, setOpenAsignar] = useState(false);
    const [versionSeleccionada, setVersionSeleccionada] = useState(null);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        getEmpleados()
            .then(setEmpleados)
            .catch((err) => {
                setCatalogoError(err.response?.data?.detail ?? "No se pudieron cargar los empleados.");
            });
        Promise.all([getVersionesLicencia(), getProveedoresLicencia()])
            .then(([vers, provs]) => {
                setVersiones(vers);
                setProveedores(provs);
            })
            .catch((err) => {
                setCatalogoError(err.response?.data?.detail ?? "No se pudieron cargar las versiones de licencia.");
            });
    }, []);

    useEffect(() => {
        if (!empleado) {
            setAsignaciones([]);
            setErrorMsg("");
            return;
        }
        cargarAsignaciones(empleado.id_emp);
    }, [empleado]);

    async function cargarAsignaciones(id_emp) {
        setLoading(true);
        setErrorMsg("");
        try {
            const data = await getAsignaciones(id_emp);
            setAsignaciones(data);
        } catch (err) {
            setErrorMsg(err.response?.data?.detail ?? "No se pudieron cargar las asignaciones.");
            setAsignaciones([]);
        } finally {
            setLoading(false);
        }
    }

    const proveedoresById = new Map(proveedores.map((p) => [p.id_prov, p.nombre]));
    const idsProvAsignados = new Set(asignaciones.map((a) => a.id_prov));
    const versionesDisponibles = versiones.filter((v) => !idsProvAsignados.has(v.id_prov));
    const sinVersionesEnCatalogo = versiones.length === 0;
    const todosProveedoresAsignados = versiones.length > 0 && versionesDisponibles.length === 0;

    function abrirAsignar() {
        setVersionSeleccionada(null);
        setOpenAsignar(true);
    }

    async function confirmarAsignacion() {
        if (!empleado || !versionSeleccionada) return;
        setGuardando(true);
        try {
            await asignarLicencia({
                id_emp: empleado.id_emp,
                id_ver: versionSeleccionada.id_ver,
            });
            setOpenAsignar(false);
            setVersionSeleccionada(null);
            await cargarAsignaciones(empleado.id_emp);
        } catch (err) {
            await showAlert({
                title: "Atención",
                message: err.response?.data?.detail ?? "No se pudo asignar la licencia.",
                severity: "warning",
            });
        } finally {
            setGuardando(false);
        }
    }

    async function handleDesasignar(asig) {
        const ok = await confirm({
            title: "Desasignar licencia",
            message: `¿Quitar ${asig.proveedor} — ${asig.version} de ${empleado.nombre}?`,
            confirmText: "Desasignar",
            severity: "warning",
        });
        if (!ok) return;
        try {
            await desasignarLicencia(empleado.id_emp, asig.id_ver);
            await cargarAsignaciones(empleado.id_emp);
        } catch (err) {
            await showAlert({
                title: "Error",
                message: err.response?.data?.detail ?? "No se pudo desasignar la licencia.",
                severity: "error",
            });
        }
    }

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                    <Typography variant="h5">Licencias</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Asigna o quita versiones de licencia a empleados. Proveedor y versión se gestionan en Mantenedor.
                    </Typography>
                </Box>
                {isEditor && empleado && (
                    <Button
                        variant="contained"
                        onClick={abrirAsignar}
                        disabled={versionesDisponibles.length === 0}
                    >
                        Asignar licencia
                    </Button>
                )}
            </Box>

            <Autocomplete
                options={empleados.filter((e) => e.operatividad !== false)}
                getOptionLabel={(opt) => `${opt.nombre} (${opt.rut})`}
                value={empleado}
                onChange={(_, value) => setEmpleado(value)}
                isOptionEqualToValue={(opt, val) => opt.id_emp === val.id_emp}
                sx={{ maxWidth: 480, mb: 3 }}
                renderInput={(params) => (
                    <TextField {...params} label="Empleado" placeholder="Buscar por nombre o RUT" />
                )}
            />

            {catalogoError && (
                <Alert severity="error" sx={{ mb: 2 }}>{catalogoError}</Alert>
            )}

            {errorMsg && (
                <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>
            )}

            {isEditor && empleado && sinVersionesEnCatalogo && !catalogoError && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    No hay versiones de licencia en Mantenedor. Crea proveedor y versión antes de asignar.
                </Alert>
            )}

            {isEditor && empleado && todosProveedoresAsignados && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Este empleado ya tiene una licencia de cada proveedor disponible.
                </Alert>
            )}

            {!empleado ? (
                <Typography variant="body2" color="text.secondary">
                    Selecciona un empleado para ver y gestionar sus licencias.
                </Typography>
            ) : loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={32} />
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Proveedor</TableCell>
                                <TableCell>Versión</TableCell>
                                <TableCell>Fecha asignación</TableCell>
                                {isEditor && <TableCell align="right">Acciones</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {asignaciones.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isEditor ? 4 : 3}>
                                        <Typography variant="body2" color="text.secondary">
                                            No hay licencias asignadas a este empleado.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                asignaciones.map((asig) => (
                                    <TableRow key={asig.id_ver}>
                                        <TableCell sx={{ fontWeight: 600 }}>{asig.proveedor}</TableCell>
                                        <TableCell>{asig.version}</TableCell>
                                        <TableCell>{asig.fecha_asignacion ?? "—"}</TableCell>
                                        {isEditor && (
                                            <TableCell align="right">
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => handleDesasignar(asig)}
                                                >
                                                    Desasignar
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={openAsignar} onClose={() => !guardando && setOpenAsignar(false)} fullWidth maxWidth="sm">
                <DialogTitle>Asignar licencia</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Empleado: {empleado?.nombre}
                    </Typography>
                    <Autocomplete
                        options={versionesDisponibles}
                        getOptionLabel={(opt) => etiquetaVersion(opt, proveedoresById)}
                        value={versionSeleccionada}
                        onChange={(_, value) => setVersionSeleccionada(value)}
                        isOptionEqualToValue={(opt, val) => opt.id_ver === val.id_ver}
                        renderInput={(params) => (
                            <TextField {...params} label="Licencia" placeholder="Proveedor — versión" />
                        )}
                    />
                    {sinVersionesEnCatalogo && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            No hay versiones de licencia en Mantenedor.
                        </Alert>
                    )}
                    {todosProveedoresAsignados && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Este empleado ya tiene una licencia de cada proveedor.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAsignar(false)} disabled={guardando}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={confirmarAsignacion}
                        disabled={!versionSeleccionada || guardando}
                    >
                        Asignar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
