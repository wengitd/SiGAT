import { useEffect, useState, useCallback, useMemo } from "react"
import { Box, Typography, Chip, Button } from "@mui/material"
import { DataGrid } from "@mui/x-data-grid"

import { useAuth } from "../context/AuthContext"
import { getSolicitudesBaja } from "../services/solicitudBajaService"
import { getActivos } from "../services/activoService"
import axiosClient from "../api/axiosClient"

import SolicitudBajaModal from "../components/SolicitudBajaModal"
import ResolverBajaModal from "../components/ResolverBajaModal"
import BorradoModal from "../components/BorradoModal"

const ESTADO_COLOR = { pendiente: "warning", aprobada: "success", rechazada: "error" }

export default function SolicitudesBajaPage() {
  const { isEditor } = useAuth()

  const [solicitudes, setSolicitudes] = useState([])
  const [activos, setActivos] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalCrear, setModalCrear] = useState(false)
  const [solicitudAResolver, setSolicitudAResolver] = useState(null)
  const [solicitudABorrar, setSolicitudABorrar] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    return getSolicitudesBaja().then(data => {
      setSolicitudes(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    refetch()
    getActivos().then(setActivos)
    axiosClient.get("/empleado/").then(r => setEmpleados(r.data))
  }, [refetch])

  const activoLabel = useMemo(() => {
    const map = new Map(activos.map(a => [a.id_act, `${a.nombre_marca ?? ""} ${a.nombre_modelo ?? ""} — N° serie ${a.num_serie ?? "s/n"}`.trim()]))
    return (id) => map.get(id) ?? `Activo #${id}`
  }, [activos])

  const empleadoNombre = useMemo(() => {
    const map = new Map(empleados.map(e => [e.id_emp, e.nombre]))
    return (id) => id ? (map.get(id) ?? `#${id}`) : "—"
  }, [empleados])

  // bloquean una nueva solicitud sobre el mismo activo hasta que se resuelva o se rechace
  const solicitudesPendientes = useMemo(
    () => solicitudes.filter(s => s.estado_sol !== "rechazada"),
    [solicitudes]
  )

  const columns = [
    { field: "id_solbaja", headerName: "ID", width: 20 },
    { field: "id_act", headerName: "Activo", width: 220, valueGetter: (value) => activoLabel(value) },
    { field: "motivo_baja", headerName: "Motivo", width: 220 },
    {
      field: "estado_sol", headerName: "Estado", width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color={ESTADO_COLOR[params.value] ?? "default"} size="small" />
      ),
    },
    { field: "fecha_solicitud", headerName: "Solicitada", width: 110 },
    { field: "fecha_resolucion", headerName: "Resuelta", width: 110, valueFormatter: (value) => value ?? "—" },
    { field: "id_emp_sol", headerName: "Solicitante", width: 150, valueGetter: (value) => empleadoNombre(value) },
    { field: "fecha_borrado", headerName: "Borrado", width: 110, valueFormatter: (value) => value ?? "—" },
    {
      field: "acciones", headerName: "Acciones", width: 180, sortable: false, filterable: false,
      renderCell: (params) => {
        if (!isEditor) return null
        if (params.row.estado_sol === "pendiente")
          return <Button size="small" variant="outlined" onClick={() => setSolicitudAResolver(params.row)}>Resolver</Button>
        if (params.row.estado_sol === "aprobada" && !params.row.fecha_borrado)
          return <Button size="small" variant="outlined" color="error" onClick={() => setSolicitudABorrar(params.row)}>Registrar borrado</Button>
        return null
      },
    },
  ]

  if (loading) return <p>Cargando...</p>

  return (
    <Box component="section" sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
          Solicitudes de baja
        </Typography>
        <Button variant="contained" onClick={() => setModalCrear(true)}>Nueva solicitud</Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 1 }}>
        Total: {solicitudes.length} solicitudes
      </Typography>

      <Box sx={{ height: 500, mt: 2 }}>
        <DataGrid rows={solicitudes} columns={columns} getRowId={(row) => row.id_solbaja} />
      </Box>

      <SolicitudBajaModal
        open={modalCrear}
        onClose={() => setModalCrear(false)}
        solicitudesPendientes={solicitudesPendientes}
        onCreada={refetch}
      />

      <ResolverBajaModal
        open={!!solicitudAResolver}
        onClose={() => setSolicitudAResolver(null)}
        solicitud={solicitudAResolver}
        onResuelta={refetch}
      />

      <BorradoModal
        open={!!solicitudABorrar}
        onClose={() => setSolicitudABorrar(null)}
        solicitud={solicitudABorrar}
        onRegistrado={refetch}
      />
    </Box>
  )
}
