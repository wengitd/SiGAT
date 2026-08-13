import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getTrazabilidadActivo, getTrazabilidadEmpleado } from "../api";
import { getActivos } from "../../inventario/api";
import { getEmpleados } from "../../empleados/api";

import {
    Box, Typography, Paper, Tabs, Tab, Autocomplete, TextField,
    Grid, Card, CardContent, Chip, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Button,
} from "@mui/material";
import ActaEntregaDialog from "../../asignaciones/components/ActaEntregaDialog";
import ChecklistDetalleDialog from "../../checklist/components/ChecklistDetalleDialog";

import DevicesIcon from "@mui/icons-material/Devices";
import PersonIcon from "@mui/icons-material/Person";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import VisibilityIcon from "@mui/icons-material/Visibility";

/** Panel con altura uniforme dentro de la fila del Grid */
const panelSx = {
    p: 2,
    height: "100%",
    display: "flex",
    flexDirection: "column",
};

/** Contenido flexible: vacío o tabla con scroll */
const panelBodySx = {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
};

const tableContainerSx = {
    flex: 1,
    maxHeight: 300,
    overflow: "auto",
};

const emptyStateSx = {
    flex: 1,
    display: "flex",
    alignItems: "center",
};

const sectionTitleSx = {
    mb: 2,
    display: "flex",
    alignItems: "center",
    gap: 1,
    fontSize: "1.1rem",
};

export default function TrazabilidadPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [tabIndex, setTabIndex] = useState(0); // 0: Activo, 1: Empleado

    // Opciones para autocompletar
    const [activosOptions, setActivosOptions] = useState([]);
    const [empleadosOptions, setEmpleadosOptions] = useState([]);

    // Selección actual
    const [selectedActivo, setSelectedActivo] = useState(null);
    const [selectedEmpleado, setSelectedEmpleado] = useState(null);

    // Datos de trazabilidad
    const [dataActivo, setDataActivo] = useState(null);
    const [dataEmpleado, setDataEmpleado] = useState(null);

    const [loadingData, setLoadingData] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [actaDialogId, setActaDialogId] = useState(null);
    const [checklistDetalle, setChecklistDetalle] = useState(null);

    // Cargar listas iniciales para los dropdowns
    useEffect(() => {
        getActivos().then(setActivosOptions).catch(() => { });
        getEmpleados().then(setEmpleadosOptions).catch(() => { });
    }, []);

    // Manejar parámetros de la URL (?tipo=activo&id=X o ?tipo=empleado&id=Y)
    useEffect(() => {
        const tipo = searchParams.get("tipo");
        const id = searchParams.get("id");

        if (tipo === "activo" && id && activosOptions.length > 0) {
            setTabIndex(0);
            const found = activosOptions.find((a) => a.id_act === Number(id));
            if (found) {
                setSelectedActivo(found);
                cargarTrazabilidadActivo(found.id_act);
            }
        } else if (tipo === "empleado" && id && empleadosOptions.length > 0) {
            setTabIndex(1);
            const found = empleadosOptions.find((e) => e.id_emp === Number(id));
            if (found) {
                setSelectedEmpleado(found);
                cargarTrazabilidadEmpleado(found.id_emp);
            }
        }
    }, [searchParams, activosOptions, empleadosOptions]);

    const cargarTrazabilidadActivo = (id_act) => {
        setLoadingData(true);
        setErrorMsg("");
        getTrazabilidadActivo(id_act)
            .then((res) => setDataActivo(res))
            .catch((err) => setErrorMsg("Error al obtener la trazabilidad del activo."))
            .finally(() => setLoadingData(false));
    };

    const cargarTrazabilidadEmpleado = (id_emp) => {
        setLoadingData(true);
        setErrorMsg("");
        getTrazabilidadEmpleado(id_emp)
            .then((res) => setDataEmpleado(res))
            .catch((err) => setErrorMsg("Error al obtener la trazabilidad del empleado."))
            .finally(() => setLoadingData(false));
    };

    const handleTabChange = (_, newValue) => {
        setTabIndex(newValue);
        setErrorMsg("");
    };

    return (
        <Box component="section" sx={{ p: 1 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                    <HistoryIcon color="primary" fontSize="large" /> Trazabilidad de Activos y Empleados
                </Typography>
                <Typography color="text.secondary" variant="body2">
                    Consulta el historial completo de asignaciones y estados de un equipo o la historia de activos y licencias de un trabajador.
                </Typography>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabIndex} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
                    <Tab icon={<DevicesIcon />} iconPosition="start" label="Trazabilidad por Activo" />
                    <Tab icon={<PersonIcon />} iconPosition="start" label="Trazabilidad por Empleado" />
                </Tabs>
            </Paper>

            {/* ERROR ALERT */}
            {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

            {/* TAB 0: TRAZABILIDAD POR ACTIVO */}
            {tabIndex === 0 && (
                <Box>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Autocomplete
                            options={activosOptions}
                            getOptionLabel={(option) =>
                                `${option.nombre_marca ?? ""} ${option.nombre_modelo ?? ""} — Serie: ${option.num_serie ?? "S/N"}`
                            }
                            value={selectedActivo}
                            onChange={(_, newValue) => {
                                setSelectedActivo(newValue);
                                if (newValue) {
                                    setSearchParams({ tipo: "activo", id: newValue.id_act });
                                    cargarTrazabilidadActivo(newValue.id_act);
                                } else {
                                    setDataActivo(null);
                                    setSearchParams({});
                                }
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Buscar Activo por Marca, Modelo o N° de Serie" placeholder="Selecciona un activo..." />
                            )}
                        />
                    </Paper>

                    {loadingData && (
                        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {!loadingData && dataActivo && (
                        <Grid container spacing={3}>
                            {/* Ficha Resumen del Activo */}
                            <Grid size={12}>
                                <Card variant="outlined" sx={{ borderLeft: "6px solid #1976d2", height: "100%" }}>
                                    <CardContent>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    {dataActivo.activo.nombre_marca} {dataActivo.activo.nombre_modelo}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    N° Serie: <strong>{dataActivo.activo.num_serie}</strong> | Tipo: <strong>{dataActivo.activo.nombre_subtipo}</strong> | Origen: <strong>{dataActivo.activo.origen}</strong>
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                <Chip label={`Estado: ${dataActivo.activo.nombre_estado}`} color="primary" variant="outlined" size="small" />
                                                <Chip label={`Disponibilidad: ${dataActivo.activo.nombre_dispo}`} color={dataActivo.activo.dispo_color ?? "default"} size="small" />
                                            </Box>
                                        </Box>

                                        {dataActivo.activo.empleado_asignado ? (
                                            <Typography variant="body2" sx={{ mt: 1.5, color: "#2e7d32", fontWeight: 600 }}>
                                                Asignado actualmente a: {dataActivo.activo.empleado_asignado}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary", fontStyle: "italic" }}>
                                                Actualmente sin asignación activa
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Historial de Asignaciones */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper sx={panelSx}>
                                    <Typography variant="h6" sx={sectionTitleSx}>
                                        <CheckCircleIcon color="action" /> Historial de Asignaciones
                                    </Typography>

                                    <Box sx={panelBodySx}>
                                        {dataActivo.historial_asignaciones.length === 0 ? (
                                            <Box sx={emptyStateSx}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Sin registros de asignación anteriores.
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <TableContainer component={Paper} variant="outlined" sx={tableContainerSx}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Empleado</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>RUT</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Departamento</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Fecha Entrega</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Fecha Devolución</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Estado Asignación</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Acta</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Registrado Por</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {dataActivo.historial_asignaciones.map((asig) => (
                                                            <TableRow key={asig.id_asig}>
                                                                <TableCell sx={{ fontWeight: 600 }}>{asig.empleado.nombre}</TableCell>
                                                                <TableCell>{asig.empleado.rut}</TableCell>
                                                                <TableCell>{asig.empleado.departamento ?? "—"}</TableCell>
                                                                <TableCell>{asig.fecha_entr}</TableCell>
                                                                <TableCell>{asig.fecha_dev ?? "—"}</TableCell>
                                                                <TableCell>
                                                                    {asig.activo_actual ? (
                                                                        <Chip label="Vigente" color="success" size="small" />
                                                                    ) : (
                                                                        <Chip label="Devuelto" variant="outlined" size="small" />
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {asig.ruta_acta_entr ? (
                                                                        <Button
                                                                            size="small"
                                                                            variant="outlined"
                                                                            onClick={() => setActaDialogId(asig.id_asig)}
                                                                        >
                                                                            Ver
                                                                        </Button>
                                                                    ) : "—"}
                                                                </TableCell>
                                                                <TableCell>{asig.registrado_por ?? "—"}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Historial de Cambios de Estado */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper sx={panelSx}>
                                    <Typography variant="h6" sx={sectionTitleSx}>
                                        <HistoryIcon color="action" /> Historial de Cambios de Estado Técnico
                                    </Typography>

                                    <Box sx={panelBodySx}>
                                        {dataActivo.historial_estados.length === 0 ? (
                                            <Box sx={emptyStateSx}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Sin registros de cambio de estado técnico.
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <TableContainer component={Paper} variant="outlined" sx={tableContainerSx}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Fecha y Hora</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Estado Registrado</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Causa</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Observación / Descripción</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Registrado Por</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {dataActivo.historial_estados.map((hes) => (
                                                            <TableRow key={hes.id_hes}>
                                                                <TableCell>{hes.fecha_reg ? hes.fecha_reg.slice(0, 10) : "—"}</TableCell>
                                                                <TableCell sx={{ fontWeight: 600 }}>{hes.estado}</TableCell>
                                                                <TableCell>{hes.causa}</TableCell>
                                                                <TableCell>{hes.descr ?? "—"}</TableCell>
                                                                <TableCell>{hes.registrado_por ?? "—"}</TableCell>
                                                           
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Historial de checklists */}
                            <Grid size={12}>
                                <Paper sx={panelSx}>
                                    <Typography variant="h6" sx={sectionTitleSx}>
                                        <PlaylistAddCheckIcon color="action" /> Historial de Checklists
                                    </Typography>

                                    <Box sx={panelBodySx}>
                                        {(dataActivo.historial_checklists ?? []).length === 0 ? (
                                            <Box sx={emptyStateSx}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Sin checklists de preparación o reasignación.
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <TableContainer component={Paper} variant="outlined" sx={tableContainerSx}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Nombre</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Propósito</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Estado</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Progreso</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Inicio</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Término</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Registrado Por</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }} align="right">Detalle</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {(dataActivo.historial_checklists ?? []).map((chk) => (
                                                            <TableRow key={chk.id_check} hover>
                                                                <TableCell sx={{ fontWeight: 600 }}>{chk.nombre}</TableCell>
                                                                <TableCell>
                                                                    {chk.proposito === "Preparacion" ? "Preparación" : "Reasignación"}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        size="small"
                                                                        label={chk.estado}
                                                                        color={
                                                                            chk.estado === "Cerrado"
                                                                                ? "success"
                                                                                : chk.estado === "Abierto"
                                                                                    ? "warning"
                                                                                    : "default"
                                                                        }
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" component="span">
                                                                        {chk.pasos_completados ?? 0}/{chk.pasos_total ?? 0}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>{chk.fecha_ini ?? "—"}</TableCell>
                                                                <TableCell>{chk.fecha_ter ?? "—"}</TableCell>
                                                                <TableCell>{chk.registrado_por ?? "—"}</TableCell>
                                                                <TableCell align="right">
                                                                    <Button
                                                                        size="small"
                                                                        startIcon={<VisibilityIcon />}
                                                                        onClick={() => setChecklistDetalle(chk)}
                                                                    >
                                                                        Ver
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                </Box>
            )}

            {/* TAB 1: TRAZABILIDAD POR EMPLEADO */}
            {tabIndex === 1 && (
                <Box>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Autocomplete
                            options={empleadosOptions}
                            getOptionLabel={(option) =>
                                `${option.nombre} (${option.rut}) — ${option.cargo?.nombre ?? "Sin cargo"}`
                            }
                            value={selectedEmpleado}
                            onChange={(_, newValue) => {
                                setSelectedEmpleado(newValue);
                                if (newValue) {
                                    setSearchParams({ tipo: "empleado", id: newValue.id_emp });
                                    cargarTrazabilidadEmpleado(newValue.id_emp);
                                } else {
                                    setDataEmpleado(null);
                                    setSearchParams({});
                                }
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Buscar Empleado por Nombre, RUT o ID" placeholder="Selecciona un empleado..." />
                            )}
                        />
                    </Paper>

                    {loadingData && (
                        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {!loadingData && dataEmpleado && (
                        <Grid container spacing={3}>
                            {/* Ficha Resumen del Empleado */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        borderLeft: "6px solid #2e7d32",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                                                {dataEmpleado.empleado.nombre}
                                            </Typography>
                                            <Chip
                                                label={dataEmpleado.empleado.operatividad ? "Empleado Activo" : "Inactivo"}
                                                color={dataEmpleado.empleado.operatividad ? "success" : "error"}
                                                size="small"
                                            />
                                        </Box>

                                        <Box
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                                gap: 1.5,
                                                flex: 1,
                                                alignContent: "start",
                                            }}
                                        >
                                            {[
                                                { label: "RUT", value: dataEmpleado.empleado.rut },
                                                { label: "Email", value: dataEmpleado.empleado.email },
                                                { label: "Cargo", value: dataEmpleado.empleado.cargo },
                                                { label: "Planta", value: dataEmpleado.empleado.planta },
                                                { label: "Departamento", value: dataEmpleado.empleado.departamento },
                                                ...(dataEmpleado.empleado.sub_area
                                                    ? [{ label: "Subárea", value: dataEmpleado.empleado.sub_area }]
                                                    : []),
                                            ].map((campo) => (
                                                <Box key={campo.label} sx={{ minWidth: 0 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                                                        {campo.label}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontWeight: 600, wordBreak: "break-word" }}
                                                    >
                                                        {campo.value || "—"}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Activos Asignados Actualmente */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper sx={panelSx}>
                                    <Typography variant="h6" sx={sectionTitleSx}>
                                        <DevicesIcon color="primary" /> Equipos y Periféricos Asignados Actualmente ({dataEmpleado.activos_actuales.length})
                                    </Typography>

                                    <Box sx={panelBodySx}>
                                        {dataEmpleado.activos_actuales.length === 0 ? (
                                            <Box sx={emptyStateSx}>
                                                <Typography variant="body2" color="text.secondary">
                                                    El empleado no tiene equipos o periféricos asignados actualmente.
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <TableContainer component={Paper} variant="outlined" sx={tableContainerSx}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Marca y Modelo</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>N° Serie</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Tipo / Subtipo</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Fecha Entrega</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Acta</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Registrado Por</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {dataEmpleado.activos_actuales.map((item) => (
                                                            <TableRow key={item.id_asig}>
                                                                <TableCell sx={{ fontWeight: 600 }}>{item.activo.nombre_marca} {item.activo.nombre_modelo}</TableCell>
                                                                <TableCell>{item.activo.num_serie}</TableCell>
                                                                <TableCell>
                                                                    <Chip label={item.activo.nombre_subtipo} size="small" variant="outlined" />
                                                                </TableCell>
                                                                <TableCell>{item.fecha_entr}</TableCell>
                                                                <TableCell>
                                                                    {item.ruta_acta_entr ? (
                                                                        <Button
                                                                            size="small"
                                                                            variant="outlined"
                                                                            onClick={() => setActaDialogId(item.id_asig)}
                                                                        >
                                                                            Ver
                                                                        </Button>
                                                                    ) : "—"}
                                                                </TableCell>
                                                                <TableCell>{item.registrado_por ?? "—"}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Historial de Equipos Devueltos */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper sx={panelSx}>
                                    <Typography variant="h6" sx={sectionTitleSx}>
                                        <AssignmentReturnIcon color="action" /> Historial de Equipos y Periféricos Anteriores (Devueltos) ({dataEmpleado.historial_activos_previos.length})
                                    </Typography>

                                    <Box sx={panelBodySx}>
                                        {dataEmpleado.historial_activos_previos.length === 0 ? (
                                            <Box sx={emptyStateSx}>
                                                <Typography variant="body2" color="text.secondary">
                                                    No hay historial de equipos devueltos registrados para este empleado.
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <TableContainer component={Paper} variant="outlined" sx={tableContainerSx}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Marca y Modelo</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>N° Serie</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Tipo / Subtipo</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Fecha Entrega</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Fecha Devolución</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Acta</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Registrado Por</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {dataEmpleado.historial_activos_previos.map((item) => (
                                                            <TableRow key={item.id_asig}>
                                                                <TableCell sx={{ fontWeight: 600 }}>{item.activo.nombre_marca} {item.activo.nombre_modelo}</TableCell>
                                                                <TableCell>{item.activo.num_serie}</TableCell>
                                                                <TableCell>
                                                                    <Chip label={item.activo.nombre_subtipo} size="small" variant="outlined" />
                                                                </TableCell>
                                                                <TableCell>{item.fecha_entr}</TableCell>
                                                                <TableCell>{item.fecha_dev}</TableCell>
                                                                <TableCell>
                                                                    {item.ruta_acta_entr ? (
                                                                        <Button
                                                                            size="small"
                                                                            variant="outlined"
                                                                            onClick={() => setActaDialogId(item.id_asig)}
                                                                        >
                                                                            Ver
                                                                        </Button>
                                                                    ) : "—"}
                                                                </TableCell>
                                                                <TableCell>{item.registrado_por ?? "—"}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Licencias Asignadas */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper sx={panelSx}>
                                    <Typography variant="h6" sx={sectionTitleSx}>
                                        <VerifiedUserIcon color="primary" /> Licencias vinculadas ({dataEmpleado.licencias.length})
                                    </Typography>

                                    <Box sx={panelBodySx}>
                                        {dataEmpleado.licencias.length === 0 ? (
                                            <Box sx={emptyStateSx}>
                                                <Typography variant="body2" color="text.secondary">
                                                    No hay licencias asignadas a este empleado.
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <TableContainer component={Paper} variant="outlined" sx={tableContainerSx}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Proveedor</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Versión</TableCell>
                                                            <TableCell sx={{ backgroundColor: "#f5f5f5" }}>Fecha asignación</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {dataEmpleado.licencias.map((lic) => (
                                                            <TableRow key={lic.id_ver}>
                                                                <TableCell sx={{ fontWeight: 600 }}>{lic.proveedor}</TableCell>
                                                                <TableCell>{lic.version}</TableCell>
                                                                <TableCell>{lic.fecha_asignacion ?? "—"}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                </Box>
            )}

            <ActaEntregaDialog
                open={!!actaDialogId}
                onClose={() => setActaDialogId(null)}
                idAsig={actaDialogId}
            />
            <ChecklistDetalleDialog
                open={!!checklistDetalle}
                onClose={() => setChecklistDetalle(null)}
                checklist={checklistDetalle}
            />
        </Box>
    );
}
