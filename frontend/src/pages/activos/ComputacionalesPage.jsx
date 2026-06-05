import useActivosPorTipo from "../../hooks/useActivosPorTipo"
import useBuscador from "../../hooks/useBuscador"
import BuscadorActivos from "../../components/BuscadorActivos"
import FiltroActivos from "../../components/FiltroActivos"
import { useNavigate } from "react-router-dom"
import { useMemo } from "react"

import {Box, Typography, Chip, Link, Button} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

export default function ComputacionalesPage() {
  const { activos, loading } = useActivosPorTipo("equipo_computo")
  const navigate = useNavigate()
  const { busqueda, setBusqueda, filtros, setFiltro, limpiarFiltros, filasFiltradas } =
    useBuscador(activos, ["marca", "modelo", "num_serie", "host_name", "cpu", "nombre_dispo", "nombre_tipoeq"])

  // Opciones únicas extraídas de los datos
  const opcionesTipo  = useMemo(() => [...new Set(activos.map(a => a.nombre_tipoeq).filter(Boolean))], [activos])
  const opcionesDispo = useMemo(() => [...new Set(activos.map(a => a.nombre_dispo ).filter(Boolean))], [activos])

  const columns = [
    { field: 'id_act',    headerName: 'ID',    width: 10  },
    {field:'host_name',   headerName:'Nombre Host',width:120},
    { field: 'marca',     headerName: 'Marca', width: 150 },
    { field: 'modelo',    headerName: 'Modelo',   width: 150 },
    { field: 'num_serie', headerName: 'Numero de Serie',   width: 200 },
    { field: 'nombre_dispo', headerName: 'Disponibilidad',   width: 120,
      renderCell:(params) =>(<Chip
        label={params.value ?? "Sin datos"}
        color={params.row.dispo_color ?? "default"}
        size="small"
        />)
    },
    {field:'origen',    headerName: 'Origen',   width: 80 },
    {field:'nombre_tipoeq', headerName:'Tipo Equipo', width: 150},
    {field:'nombre_so',   headerName:'Sistema Operativo', width:150},
    {field:'cpu',         headerName:'CPU', width:100},
    {field: 'ram_capac',  headerName: 'RAM', width:50},
    {field:'disco_unidad',headerName:'Unidad',width:50},
    {field:'ram_tipo',    headerName:'Tipo Ram',width:100},
    {field:'disco_tipo',  headerName:'Tipo Disco',width: 100},
    {field:'disco_capac', headerName:'Disco Capacidad',width:100},
    {field:'fecha_recep', headerName:'Fecha Recepcion' ,width:100},
    { field: 'ruta_pdf_fact',   headerName: 'Factura',   width: 100,
      renderCell: (params) => params.value
        ? <Link href={params.value} target="_blank" rel="noreferrer" sx={{ fontSize: 14, textDecoration: 'none' }}>Ver PDF</Link>
        : '—'
    },
    //{field:'',headerName:'',width:},
  ]


  if (loading) return <p>Cargando...</p> 
  
  
  return (
    <Box component="section" sx ={{p:2}}>
      <Typography variant="body2">
        Total: {activos.length} activos
      </Typography>

      <Box>
        <Typography variant="h5" sx={{ mb: 1 }}>Equipos Computacionales</Typography>
        <Typography color="text.secondary">Aqui se visualizan todos los activos computacionales</Typography>
      </Box>
      
      <Box sx={{ mt: 1, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Button variant="contained" onClick={() => navigate("/activos/nuevoActivo", { state: { paginaOrigen: "/activos/computacionales" } })}>
          Agregar Activo
        </Button>
        <BuscadorActivos value={busqueda} onChange={setBusqueda} placeholder="Buscar por marca, modelo, serie..." />
        <FiltroActivos
          label="Tipo de equipo"
          opciones={opcionesTipo}
          value={filtros.nombre_tipoeq ?? ""}
          onChange={v => setFiltro("nombre_tipoeq", v)}
        />
        <FiltroActivos
          label="Disponibilidad"
          opciones={opcionesDispo}
          value={filtros.nombre_dispo ?? ""}
          onChange={v => setFiltro("nombre_dispo", v)}
        />
        {(busqueda || Object.values(filtros).some(v => v)) && (
          <Button size="small" color="inherit" onClick={limpiarFiltros}>Limpiar filtros</Button>
        )}
      </Box>

      <Box sx={{height:500, mt:2}}>
        <DataGrid
          rows={filasFiltradas}
          columns={columns}
          getRowId={(row) => row.id_act}
        />
      </Box>
    </Box>

  )
}



