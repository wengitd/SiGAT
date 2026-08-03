import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import {
    Box, Button, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel,
    FormControl, InputLabel, Select, MenuItem, Autocomplete
} from "@mui/material";
import AsignacionModal from "../components/AsignacionModal";
import ChecklistEjecucionDialog from "../components/ChecklistEjecucionDialog";
import { getActivos } from "../services/activoService";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";

function formatearRut(rut) {
    const limpio = rut.replace(/[^0-9kK]/g, "");
    if (limpio.length === 0) return "";
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1).toUpperCase();
    if (cuerpo.length === 0) return dv;
    let formateado = "";
    for (let i = cuerpo.length; i > 0; i -= 3) {
        const inicio = Math.max(i - 3, 0);
        formateado = cuerpo.slice(inicio, i) + (formateado ? "." + formateado : "");
    }
    return `${formateado}-${dv}`;
}

function validarRut(rut) {
    const limpio = rut.replace(/[^0-9kK]/g, "");
    if (limpio.length < 2) return false;
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1).toUpperCase();
    let suma = 0;
    let multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    const dvEsperado = 11 - (suma % 11);
    const dvStr = dvEsperado === 10 ? "K" : dvEsperado === 11 ? "0" : String(dvEsperado);
    return dv === dvStr;
}


export default function EmpleadosPage() {
    const navigate = useNavigate();
    const { isEditor } = useAuth();
    const { confirm } = useDialog();
    const [empleados, setEmpleados] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({});
    const [editando, setEditando] = useState(false);
    const [empleadoEditando, setEmpleadoEditando] = useState(null);
    const [cargos, setCargos] = useState([]);
    const [plantas, setPlantas] = useState([]);
    const [subareas, setSubareas] = useState([]);
    const [errores, setErrores] = useState({});
    const [empleadoAAsignar, setEmpleadoAAsignar] = useState(null);
    const [checklistCtx, setChecklistCtx] = useState(null);


    /*useeffect llama al get/empleado -> la respuesta se guarda en /empleados
    react re-renderiza mostrando la lista */
    useEffect(() => {
        axiosClient.get("/empleado/").then((res) => setEmpleados(res.data));
        axiosClient.get("/departamento/").then((res) => setDepartamentos(res.data));
        axiosClient.get("/cargos/").then((res) => setCargos(res.data.map(c => c.nombre)));
        axiosClient.get("/plantas/").then((res) => setPlantas(res.data.map(p => p.nombre)));
    }, []);


    /* cargar sub areas cuando cambia departamento */
    useEffect(() => {
        if (formData.id_dpto) {
            axiosClient.get(`/sub-areas/?id_dpto=${formData.id_dpto}`)
                .then((res) => setSubareas(res.data));
        } else {
            setSubareas([]);
        }
    }, [formData.id_dpto]);


    /* Funcion generica para desactivar o activar empleados
    recorre todos los empleados hasta encontrar el que se busca
    devuelve el mismo empleado pero con operatividad negativa*/
    async function toggleOperatividad(id, estadoActual) {
        const accion = estadoActual ? "desactivar" : "activar";
        const ok = await confirm({
            title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} empleado?`,
            message: `¿Estás seguro que quieres ${accion} este empleado en el sistema?`,
            severity: estadoActual ? "warning" : "info",
            confirmText: accion.charAt(0).toUpperCase() + accion.slice(1),
        });
        if (!ok) return;
        await axiosClient.put(`/empleado/${id}`, { operatividad: !estadoActual });
        setEmpleados(empleados.map((emp) =>
            emp.id_emp === id ? { ...emp, operatividad: !estadoActual } : emp
        ));
    }


    async function crearEmpleado() {
        if (!validarRut(formData.rut ?? "")) {
            setErrores({ ...errores, rut: "RUT inválido" });
            return;
        }
        try {
            const res = await axiosClient.post("/empleado/", formData);
            setEmpleados([...empleados, res.data]);
            setOpenDialog(false);
            setErrores({});
        } catch (err) {
            if (err.response?.status === 422) {
                const mapa = {};
                err.response.data.detail.forEach(e => {
                    const campo = e.loc[e.loc.length - 1];
                    mapa[campo] = e.msg;
                });
                setErrores(mapa);
            }
        }
    }


    async function actualizarEmpleado() {
        if (!validarRut(formData.rut ?? "")) {
            setErrores({ ...errores, rut: "RUT inválido" });
            return;
        }
        await axiosClient.put(`/empleado/${empleadoEditando.id_emp}`, formData);
        const res = await axiosClient.get("/empleado/");
        setEmpleados(res.data);
        setOpenDialog(false);
        setEditando(false);
        setEmpleadoEditando(null);
    }

    /*funcion para cargar los datos en el formulario del boton editar*/
    function abrirEditar(emp) {
        setFormData({
            ...emp,
            cargo: emp.cargo?.nombre ?? "",
            planta: emp.planta?.nombre ?? "",
        });
        setEmpleadoEditando(emp);
        setEditando(true);
        setOpenDialog(true);
    }

    /*funcion para refrescar boton de agregar empleado */
    function abrirCrear() {
        const camposVacios = Object.fromEntries(
            Object.keys(empleados[0] || {}).map((k) => [k, ""])
        );
        camposVacios.operatividad = true;
        setFormData(camposVacios);
        setEditando(false);
        setOpenDialog(true);
    }


    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                    <Typography variant="h5">Empleados</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Personal de la empresa destinatario de asignaciones de activos y periféricos.
                    </Typography>
                </Box>
                {isEditor && (
                    <Button variant="contained" onClick={abrirCrear}>Agregar Empleado</Button>
                )}
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell>RUT</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Cargo</TableCell>
                            <TableCell>Planta</TableCell>
                            <TableCell>Departamento</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {empleados.map((emp) => (
                            <TableRow key={emp.id_emp}>
                                <TableCell>
                                    <span style={{
                                        display: "inline-block",
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: emp.operatividad ? "#4caf50" : "#f44336",
                                        marginRight: 6,
                                        verticalAlign: "middle"
                                    }} title={emp.operatividad ? "Empleado Operativo" : "Empleado Inactivo"} />
                                </TableCell>
                                <TableCell>{emp.rut}</TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{emp.nombre}</TableCell>
                                <TableCell>{emp.email}</TableCell>
                                <TableCell>{emp.cargo.nombre}</TableCell>
                                <TableCell>{emp.planta.nombre}</TableCell>
                                <TableCell>{emp.departamento?.nom_dpto ?? "—"}</TableCell>
                                <TableCell align="right">
                                    {isEditor && (
                                        <>
                                            <Button size="small" variant="outlined" onClick={() => abrirEditar(emp)}>Editar</Button>
                                            <Button size="small" variant="outlined" color={emp.operatividad ? "error" : "success"} sx={{ ml: 1 }} onClick={() => toggleOperatividad(emp.id_emp, emp.operatividad)}>{emp.operatividad ? "Desactivar" : "Activar"}</Button>
                                            {emp.operatividad &&
                                                <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => setEmpleadoAAsignar(emp)}>Asignar activo</Button>
                                            }
                                        </>
                                    )}
                                    <Button size="small" variant="outlined" color="secondary" sx={{ ml: 1 }} onClick={() => navigate(`/trazabilidad?tipo=empleado&id=${emp.id_emp}`)}>Trazabilidad</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/*ventana modal para crear empleado */}
            <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setErrores({}); }}>
                <DialogTitle>{editando ? "Editar Empleado" : "Agregar Empleado"}</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                    <TextField sx={{ mt: 1 }} label="RUT" value={formData.rut ?? ""}
                        onChange={(e) => setFormData({ ...formData, rut: formatearRut(e.target.value) })}
                        error={!!errores.rut || (formData.rut?.length > 3 && !validarRut(formData.rut))}
                        helperText={
                            errores.rut || (formData.rut?.length > 3 && !validarRut(formData.rut) ? "RUT inválido" : "")
                        } />
                    <TextField label="Nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                    <TextField label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={!!errores.email} helperText={errores.email} />

                    {/*Cargo*/}
                    <Autocomplete
                        freeSolo /*si el usuario escribe un cargo q no existe, lo acepta y crea en la tabla */
                        options={cargos}
                        value={formData.cargo ?? ""}
                        onInputChange={(_, value) => setFormData({ ...formData, cargo: value })}
                        renderInput={(params) => <TextField {...params} label="Cargo" />}
                    />

                    {/*Planta*/}
                    <Autocomplete
                        freeSolo
                        options={plantas}
                        value={formData.planta ?? ""}
                        onInputChange={(_, value) => setFormData({ ...formData, planta: value })}
                        renderInput={(params) => <TextField {...params} label="Planta" />}
                    />

                    {/*Dropdown Departamento*/}
                    <FormControl>
                        <InputLabel>Departamento</InputLabel>
                        <Select
                            label="Departamento"
                            value={formData.id_dpto ?? ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    id_dpto: e.target.value === "" ? null : Number(e.target.value),
                                })
                            }
                        >
                            {departamentos.map((d) => (
                                <MenuItem key={d.id_dpto} value={d.id_dpto}>
                                    {d.nom_dpto}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/*Dropdown Sub Area */}
                    {formData.id_dpto && (
                        <FormControl>
                            <InputLabel>Sub área</InputLabel>
                            <Select
                                label="Sub área"
                                value={formData.id_sub ?? ""}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    id_sub: e.target.value === "" ? null : Number(e.target.value)
                                })}
                            >
                                <MenuItem value=""><em>Sin sub área</em></MenuItem>
                                {subareas.map((s) => (
                                    <MenuItem key={s.id_sub} value={s.id_sub}>{s.nombre}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/*Switch Operatividad */}
                    <FormControlLabel control={<Switch checked={Boolean(formData.operatividad)}
                        onChange={(e) => setFormData({ ...formData, operatividad: e.target.checked })} />} label="Operativo" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    {/*si editando es true actualizaempleado, sino lo crea */}
                    <Button variant="contained" onClick={editando ? actualizarEmpleado : crearEmpleado}>Guardar</Button>
                </DialogActions>
            </Dialog>

            <AsignacionModal
                open={!!empleadoAAsignar}
                onClose={() => setEmpleadoAAsignar(null)}
                empleadoFijo={empleadoAAsignar ? { id_emp: empleadoAAsignar.id_emp, label: empleadoAAsignar.nombre } : null}
                onAbrirChecklist={async (proposito, idAct) => {
                    if (!idAct) return
                    try {
                        const activos = await getActivos()
                        const activo = activos.find((a) => a.id_act === idAct)
                        if (activo) {
                            setEmpleadoAAsignar(null)
                            setChecklistCtx({ activo, proposito })
                        }
                    } catch { /* ignore */ }
                }}
            />

            <ChecklistEjecucionDialog
                open={!!checklistCtx}
                onClose={() => setChecklistCtx(null)}
                activo={checklistCtx?.activo}
                proposito={checklistCtx?.proposito}
            />

        </Box>
    );
}
