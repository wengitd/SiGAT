import useActivos from "../hooks/useActivos"

import {Box, Typography, Chip, Link} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'



export default function InventarioPage() {
  const { activos, loading } = useActivos()
  
  const columns = [
    { field: 'id_act',    headerName: 'ID',    width: 20  },
    { field: 'marca',     headerName: 'Marca', width: 150 },
    { field: 'modelo',    headerName: 'Modelo',   width: 150 },
    { field: 'num_serie', headerName: 'Numero de Serie',   width: 200 },
    { field: 'nombre_dispo', headerName: 'Disponibilidad',   width: 120, 
      renderCell:(params) =>(<Chip  
        label={params.value ?? "Sin datos"}
        color={params.value === "disponible" ? "success" : "warning"}
        size="small"
        />)  
    },
    { field: 'origen',    headerName: 'Origen',   width: 80 },
    { field: 'ruta_pdf_fact',   headerName: 'Factura',   width: 100,
      renderCell: (params) => params.value
        ? <Link href={params.value} target="_blank" rel="noreferrer" sx={{ fontSize: 14, textDecoration: 'none' }}>Ver PDF</Link>
        : '—'
    },

    { field: 'tipo',      headerName: 'Tipo Equipo', width: 150, 
      valueGetter: (value) => value === 'equipo_computo' ? 'Computacional' : 'Periférico' 
    },
    { field: 'nombre_so',         headerName:'Sistema Operativo', width:150},
    { field: 'nombre_estado',     headerName: 'Estado', width: 120 },
    { field: 'empleado_asignado', headerName: 'Asignado a', width: 180,
      valueFormatter: (value) => value ?? '— Sin asignar'
    },
  ]


  if (loading) return <p>Cargando...</p>

  return (
    <Box component="section" sx ={{p:2}}>
      
      <Typography variant="h6" sx={{fontWeight: 700, letterSpacing: 1 }}>
        Inventario
      </Typography>

      <Typography variant="body2">
        Total: {activos.length} activos
      </Typography>

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