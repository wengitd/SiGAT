import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import {
    getLicencias,
    getAsignaciones,
    asignarLicencia,
    desasignarLicencia,
} from "../services/licenciaService";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";
import {
    Box, Button, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Autocomplete, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
} from "@mui/material";

function etiquetaLicencia(lic) {
    return `${lic.proveedor} — ${lic.version}`;
}

export default function LicenciasPage() {
    const { isEditor } = useAuth();
    const { confirm, alert: showAlert } = useDialog();

    const [empleados, setEmpleados] = useState([]);
    const [empleado, setEmpleado] = useState(null);
    const [asignaciones, setAsignaciones] = useState([]);
    const [licencias, setLicencias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [openAsignar, setOpenAsignar] = useState(false);
    const [licenciaSeleccionada, setLicenciaSeleccionada] = useState(null);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        axiosClient.get("/empleado/").then((res) => setEmpleados(res.data)).catch(() => {});
        getLicencias().then(setLicencias).catch(() => {});
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

    const idsAsignadas = new Set(asignaciones.map((a) => a.id_lic));
    const licenciasDisponibles = licencias.filter((l) => !idsAsignadas.has(l.id_lic));

    function abrirAsignar() {
        setLicenciaSeleccionada(null);
        setOpenAsignar(true);
    }

    async function confirmarAsignacion() {
        if (!empleado || !licenciaSeleccionada) return;
        setGuardando(true);
        try {
            await asignarLicencia({
                id_emp: empleado.id_emp,
                id_lic: licenciaSeleccionada.id_lic,
            });
            setOpenAsignar(false);
            setLicenciaSeleccionada(null);
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
            await desasignarLicencia(empleado.id_emp, asig.id_lic);
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
                        Asigna o quita licencias a empleados. Los contratos y catálogos se gestionan en Mantenedor.
                    </Typography>
                </Box>
                {isEditor && empleado && (
                    <Button
                        variant="contained"
                        onClick={abrirAsignar}
                        disabled={licenciasDisponibles.length === 0}
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

            {errorMsg && (
                <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>
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
                                    <TableRow key={asig.id_lic}>
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
                        options={licenciasDisponibles}
                        getOptionLabel={etiquetaLicencia}
                        value={licenciaSeleccionada}
                        onChange={(_, value) => setLicenciaSeleccionada(value)}
                        isOptionEqualToValue={(opt, val) => opt.id_lic === val.id_lic}
                        renderInput={(params) => (
                            <TextField {...params} label="Licencia" placeholder="Proveedor — versión" />
                        )}
                    />
                    {licenciasDisponibles.length === 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            No quedan licencias disponibles para asignar a este empleado.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAsignar(false)} disabled={guardando}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={confirmarAsignacion}
                        disabled={!licenciaSeleccionada || guardando}
                    >
                        Asignar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
