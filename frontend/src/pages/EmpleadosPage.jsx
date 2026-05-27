import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel

} from "@mui/material";


/*aqui se carga la pagina,
*/
export default function EmpleadosPage() {
    const [empleados, setEmpleados] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({});
    const [editando, setEditando] = useState(false);
    const [empleadoEditando, setEmpleadoEditando] = useState(null);
    
    /*useeffect llama al get/empleado -> la respuesta se guarda en /empleados
    react re-renderiza mostrando la lista */
    useEffect(() => {
      axiosClient.get("/empleado/").then((res) => setEmpleados(res.data));
    }, []);

    /* soft delete de empleado 
    recorre todos los empleados hasta encontrar el que se busca
    devuelve el mismo empleado pero con operatividad negativa*/
    async function desactivarEmpleado(id) {
      if (!window.confirm("¿Estás seguro que quieres desactivar este empleado?")) return;
      await axiosClient.put(`/empleado/${id}`, { operatividad: false });
      setEmpleados(empleados.map((emp) =>
        emp.id_emp === id ? { ...emp, operatividad: false } : emp
      ));
    }

 
    async function crearEmpleado() {
      const res = await axiosClient.post("/empleado/", formData);
      setEmpleados([...empleados, res.data]);
      setOpenDialog(false);
    }
      

    async function actualizarEmpleado() {
      await axiosClient.put(`/empleado/${empleadoEditando.id_emp}`, formData);
      setEmpleados(empleados.map((emp) =>
        emp.id_emp === empleadoEditando.id_emp ? { ...emp, ...formData } : emp
      ));
      setOpenDialog(false);
      setEditando(false);
      setEmpleadoEditando(null);
    }

    /*funcion para cargar los datos en el formulario del boton editar*/
    function abrirEditar(emp) {
      setFormData({ ...emp });
      setEmpleadoEditando(emp);
      setEditando(true);
      setOpenDialog(true);
    }

    /*funcion para refrescar boton de agregar empleado */
    function abrirCrear() {
      const camposVacios = Object.fromEntries(
        Object.keys(empleados[0] || {}).map((k) => [k, ""])
      );
      setFormData(camposVacios);
      setEditando(false);
      setOpenDialog(true);
    }


    return (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5">Empleados</Typography>
          <Button variant="contained" onClick={abrirCrear}>Agregar Empleado</Button>        
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>RUT</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Cargo</TableCell>
                  <TableCell>Planta</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {empleados.map((emp) => (
                  <TableRow key={emp.id_emp}>
                    <TableCell>{emp.rut}</TableCell>
                    <TableCell>{emp.nombre}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{emp.cargo}</TableCell>
                    <TableCell>{emp.planta}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={()=>abrirEditar(emp)}>Editar</Button>
                      <Button size="small" variant="outlined" color="error" sx={{ ml: 1 }} onClick={() => desactivarEmpleado(emp.id_emp)}>Desactivar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/*ventana modal para crear empleado */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>    
          <DialogTitle>{editando ? "Editar Empleado" : "Agregar Empleado"}</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField label="RUT" value={formData.rut} onChange={(e) => setFormData({ ...formData, rut: e.target.value })} />
            <TextField label="Nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
            <TextField label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <TextField label="Cargo" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} />
            <TextField label="Planta" value={formData.planta} onChange={(e) => setFormData({ ...formData, planta: e.target.value })} />
            <TextField label="ID Departamento" type="number" value={formData.id_dpto} onChange={(e) => setFormData({ ...formData, id_dpto: e.target.value })} />
            <FormControlLabel control={<Switch checked={formData.operatividad} onChange={(e) => setFormData({ ...formData, operatividad: e.target.checked })} />} label="Operativo" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            {/*si editando es true actualizaempleado, sino lo crea */}
            <Button variant="contained" onClick={editando ? actualizarEmpleado : crearEmpleado}>Guardar</Button>
            </DialogActions>
        </Dialog>
      


        </Box>
      );
}
    