import useActivos from "../hooks/useActivos"
import {Box, Typography} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'



export default function InventarioPage() {
  const { activos, loading } = useActivos()
  
  const columns = [
    { field: 'id_act',    headerName: 'ID',    width: 20  },
    { field: 'marca',     headerName: 'Marca', width: 150 },
    { field: 'modelo',    headerName: 'Modelo',   width: 150 },
    { field: 'num_serie', headerName: 'Numero de Serie',   width: 200 },
    { field: 'disponibilidad', headerName: 'Disponibilidad',   width: 100 },
    { field: 'origen',    headerName: 'Origen',   width: 80 },
    { field: 'id_fact',   headerName: 'Factura',   width: 100 },
    { field: 'tipo',      headerName: 'Tipo estado', width: 150}
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

      <DataGrid
        rows={activos}
        columns={columns}
        getRowId={(row) => row.id_act}
      />
      
    
    </Box>
  )
}