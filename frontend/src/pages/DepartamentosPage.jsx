import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Chip, Autocomplete
} from "@mui/material";

const ZONAS = ["Administracion", "Operaciones", "Produccion"];

export default function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [todasSubareas, setTodasSubareas] = useState([]);

  const [openDpto, setOpenDpto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [dptoEditando, setDptoEditando] = useState(null);
  const [formDpto, setFormDpto] = useState({ nom_dpto: "", zona: "", id_org: "" });
  const [erroresDpto, setErroresDpto] = useState({});

  // En crear: strings. En editar: objetos {id_sub, nombre}
  const [subareas, setSubareas] = useState([]);
  const [subareasAgregadas, setSubareasAgregadas] = useState([]);
  const [nuevaSub, setNuevaSub] = useState("");
  const [errorSub, setErrorSub] = useState("");

  useEffect(() => {
    cargarDepartamentos();
    axiosClient.get("/empresas/").then((res) => setEmpresas(res.data));
    axiosClient.get("/sub-areas/").then((res) => {
      const nombres = [...new Set(res.data.map((s) => s.nombre))];
      setTodasSubareas(nombres);
    });
  }, []);

  function cargarDepartamentos() {
    axiosClient.get("/departamento/").then((res) => setDepartamentos(res.data));
  }

  function resetSubareas() {
    setSubareas([]);
    setSubareasAgregadas([]);
    setNuevaSub("");
    setErrorSub("");
  }

  function abrirCrear() {
    setFormDpto({ nom_dpto: "", zona: "", id_org: "" });
    setEditando(false);
    setDptoEditando(null);
    setErroresDpto({});
    resetSubareas();
    setOpenDpto(true);
  }

  async function abrirEditar(dpto) {
    setFormDpto({
      nom_dpto: dpto.nom_dpto,
      zona: dpto.zona ?? "",
      id_org: dpto.id_org,
    });
    setEditando(true);
    setDptoEditando(dpto);
    setErroresDpto({});
    resetSubareas();
    const res = await axiosClient.get(`/sub-areas/?id_dpto=${dpto.id_dpto}`);
    setSubareas(res.data);
    setOpenDpto(true);
  }

  async function guardarDpto() {
    try {
      if (editando) {
        await axiosClient.put(`/departamento/${dptoEditando.id_dpto}`, formDpto);
      } else {
        // Crear departamento y luego sus subáreas locales
        const res = await axiosClient.post("/departamento/", formDpto);
        const id_dpto = res.data.id_dpto;
        for (const nombre of subareas) {
          await axiosClient.post("/sub-areas/", { nombre, id_dpto });
        }
      }
      cargarDepartamentos();
      resetSubareas();
      setOpenDpto(false);
    } catch (err) {
      if (err.response?.status === 422) {
        const mapa = {};
        err.response.data.detail.forEach((e) => {
          const campo = e.loc[e.loc.length - 1];
          mapa[campo] = e.msg;
        });
        setErroresDpto(mapa);
      } else if (err.response?.status === 400) {
        alert(err.response.data.detail);
      }
    }
  }

  async function cancelar() {
    // En editar: deshacer subáreas agregadas en esta sesión
    for (const id_sub of subareasAgregadas) {
      await axiosClient.delete(`/sub-areas/${id_sub}`);
    }
    resetSubareas();
    setOpenDpto(false);
  }

  async function agregarSubarea() {
    if (!nuevaSub.trim()) return;

    if (editando) {
      try {
        const res = await axiosClient.post("/sub-areas/", {
          nombre: nuevaSub.trim(),
          id_dpto: dptoEditando.id_dpto,
        });
        setSubareas([...subareas, res.data]);
        setSubareasAgregadas([...subareasAgregadas, res.data.id_sub]);
        setNuevaSub("");
        setErrorSub("");
      } catch (err) {
        if (err.response?.status === 400) setErrorSub(err.response.data.detail);
      }
    } else {
      if (subareas.includes(nuevaSub.trim())) {
        setErrorSub("Ya existe esa subárea");
        return;
      }
      setSubareas([...subareas, nuevaSub.trim()]);
      setNuevaSub("");
      setErrorSub("");
    }
  }

  async function eliminarSubarea(identificador) {
    if (editando) {
      try {
        await axiosClient.delete(`/sub-areas/${identificador}`);
        setSubareas(subareas.filter((s) => s.id_sub !== identificador));
      } catch (err) {
        if (err.response?.status === 400) alert(err.response.data.detail);
      }
    } else {
      setSubareas(subareas.filter((_, i) => i !== identificador));
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Departamentos</Typography>
        <Button variant="contained" onClick={abrirCrear}>Agregar Departamento</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Zona</TableCell>
              <TableCell>Empresa</TableCell>
              <TableCell>Subáreas</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departamentos.map((dpto) => (
              <TableRow key={dpto.id_dpto}>
                <TableCell>{dpto.nom_dpto}</TableCell>
                <TableCell>{dpto.zona ?? "—"}</TableCell>
                <TableCell>{dpto.empresa?.nombre ?? "—"}</TableCell>
                <TableCell>
                  {dpto.subareas?.length > 0
                    ? dpto.subareas.map((s) => s.nombre).join(", ")
                    : "—"}
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => abrirEditar(dpto)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDpto} onClose={cancelar} fullWidth maxWidth="xs">
        <DialogTitle>{editando ? "Editar Departamento" : "Agregar Departamento"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 3 }}>
          <TextField
            label="Nombre"
            sx={{ mt: 1 }}
            value={formDpto.nom_dpto}
            onChange={(e) => setFormDpto({ ...formDpto, nom_dpto: e.target.value })}
            error={!!erroresDpto.nom_dpto}
            helperText={erroresDpto.nom_dpto}
          />
          <FormControl>
            <InputLabel>Zona</InputLabel>
            <Select
              label="Zona"
              value={formDpto.zona}
              onChange={(e) => setFormDpto({ ...formDpto, zona: e.target.value })}
            >
              <MenuItem value=""><em>Sin zona</em></MenuItem>
              {ZONAS.map((z) => (
                <MenuItem key={z} value={z}>{z}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl error={!!erroresDpto.id_org}>
            <InputLabel>Empresa</InputLabel>
            <Select
              label="Empresa"
              value={formDpto.id_org}
              onChange={(e) => setFormDpto({ ...formDpto, id_org: e.target.value })}
            >
              <MenuItem value=""><em>Sin empresa</em></MenuItem>
              {empresas.map((emp) => (
                <MenuItem key={emp.id_org} value={emp.id_org}>{emp.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Subáreas — disponible en crear y editar */}
          <Box sx={{ width: "100%" }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
              {subareas.length === 0 && (
                <Typography variant="body2" color="text.secondary">Sin subáreas</Typography>
              )}
              {editando
                ? subareas.map((s) => (
                    <Chip key={s.id_sub} label={s.nombre} onDelete={() => eliminarSubarea(s.id_sub)} />
                  ))
                : subareas.map((nombre, i) => (
                    <Chip key={i} label={nombre} onDelete={() => eliminarSubarea(i)} />
                  ))}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Autocomplete
                freeSolo
                fullWidth
                options={todasSubareas}
                inputValue={nuevaSub}
                onInputChange={(_, value) => setNuevaSub(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Nueva subárea"
                    size="small"
                    error={!!errorSub}
                    helperText={errorSub}
                    onKeyDown={(e) => e.key === "Enter" && agregarSubarea()}
                  />
                )}
              />
              <Button variant="contained" onClick={agregarSubarea}>Agregar</Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelar}>Cancelar</Button>
          <Button variant="contained" onClick={guardarDpto}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
