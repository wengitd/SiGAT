import useActivosPorTipo from "../../hooks/useActivosPorTipo"


import {Box, Typography, Chip, Link} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

export default function ComputacionalesPage() {
  const { activos, loading } = useActivosPorTipo("equipo_computo")
  
  const columns = [
    { field: 'id_act',    headerName: 'ID',    width: 10  },
    {field:'host_name',   headerName:'Nombre Host',width:120},
    { field: 'marca',     headerName: 'Marca', width: 150 },
    { field: 'modelo',    headerName: 'Modelo',   width: 150 },
    { field: 'num_serie', headerName: 'Numero de Serie',   width: 200 },
    { field: 'disponibilidad', headerName: 'Disponibilidad',   width: 120, 
      renderCell:(params) =>(<Chip  
        label={params.value ? "Disponible" : "En uso"}
        color={params.value ? "success" : "error"}
        size="small"
        />)  
    },
    { field: 'origen',    headerName: 'Origen',   width: 80 },
    //{ field: 'tipo',      headerName: 'Tipo Equipo', width: 150},
    {field:'nombre_so',   headerName:'Sistema Operativo', width:150},
    {field:'cpu',         headerName:'CPU', width:100},
    {field: 'ram_capac',  headerName: 'RAM', width:50},
    {field:'disco_unidad',headerName:'Unidad',width:50},
    {field:'ram_tipo',    headerName:'Tipo Ram',width:100},
    {field:'disco_tipo',  headerName:'Tipo Disco',width: 100},
    {field:'disco_capac', headerName:'Disco Capacidad',width:100},
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
        <Typography color="text.secondary">.</Typography>
      </Box>
      

      <Box sx={{height:500, mt:2}}>
        <DataGrid
          rows={activos}
          columns={columns}
          getRowId={(row) => row.id_act}
        />
      </Box>
    </Box>

  )
}



