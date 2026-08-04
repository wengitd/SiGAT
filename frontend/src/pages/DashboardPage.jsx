import { useEffect, useState } from "react"
import { Box, Card, Typography, CircularProgress, Alert } from "@mui/material"
import { PieChart } from "@mui/x-charts/PieChart"
import { BarChart } from "@mui/x-charts/BarChart"

import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined"
import ComputerOutlinedIcon from "@mui/icons-material/ComputerOutlined"
import EventOutlinedIcon from "@mui/icons-material/EventOutlined"
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined"

import { getResumenDashboard } from "../services/dashboardService"
import StatCard from "../components/dashboard/StatCard"

// Paleta de acento para series/segmentos dinámicos (proveedores, familias de SO)
const PALETA = ["#1B6B5A", "#0288D1", "#4CAF8F", "#ED6C02", "#7C6FE0", "#D32F2F"]

// Colores fijos para los estados de un activo (coinciden con la semántica del tema)
const COLOR_ESTADO = {
    Bueno: "#2E7D32",
    Regular: "#7C6FE0",
    Malo: "#ED6C02",
    "De baja": "#D32F2F",
}

export default function DashboardPage() {
    const [resumen, setResumen] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        getResumenDashboard()
            .then(setResumen)
            .catch(() => setError("No se pudo cargar el resumen del dashboard."))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>
    }

    const { activos, licencias_totales, sistemas_operativos, activos_por_estado, licencias_por_mes } = resumen

    const dataSO = sistemas_operativos.map((s, i) => ({
        id: s.familia,
        label: s.familia,
        value: s.total,
        color: PALETA[i % PALETA.length],
    }))

    const dataEstado = activos_por_estado.map((e) => ({
        id: e.estado,
        label: e.estado,
        value: e.total,
        color: COLOR_ESTADO[e.estado] ?? "#6B7280",
    }))

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 3 }}>Dashboard</Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 3 }}>
                {/* Columna izquierda */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                        <StatCard icon={ComputerOutlinedIcon} value={activos.equipo_computo} label="Total activos computacionales" color="#1B6B5A" />
                        <StatCard icon={PrintOutlinedIcon} value={activos.periferico} label="Total activos periféricos" color="#0288D1" />
                        <StatCard icon={EventOutlinedIcon} value={activos.adquiridos_anio} label="Activos adquiridos este año" color="#4CAF8F" />
                    </Box>

                    {licencias_totales.length > 0 && (
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: `repeat(${Math.min(licencias_totales.length, 3)}, 1fr)` }, gap: 2 }}>
                            {licencias_totales.map((l, i) => (
                                <StatCard
                                    key={l.proveedor}
                                    icon={VpnKeyOutlinedIcon}
                                    value={l.total}
                                    label={`Total Licencias ${l.proveedor}`}
                                    color={PALETA[i % PALETA.length]}
                                />
                            ))}
                        </Box>
                    )}

                    <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            Licencias asignadas por mes
                        </Typography>
                        {licencias_por_mes.series.length > 0 ? (
                            <BarChart
                                height={320}
                                xAxis={[{ scaleType: "band", data: licencias_por_mes.labels }]}
                                series={licencias_por_mes.series.map((s, i) => ({
                                    data: s.data,
                                    label: s.proveedor,
                                    color: PALETA[i % PALETA.length],
                                }))}
                            />
                        ) : (
                            <Typography color="text.secondary">Sin licencias asignadas registradas.</Typography>
                        )}
                    </Card>
                </Box>

                {/* Columna derecha */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            Sistemas operativos
                        </Typography>
                        {dataSO.length > 0 ? (
                            <PieChart series={[{ data: dataSO, innerRadius: 30 }]} height={260} />
                        ) : (
                            <Typography color="text.secondary">Sin equipos con sistema operativo registrado.</Typography>
                        )}
                    </Card>

                    <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            Activos por estado
                        </Typography>
                        {dataEstado.length > 0 ? (
                            <PieChart series={[{ data: dataEstado, innerRadius: 30 }]} height={260} />
                        ) : (
                            <Typography color="text.secondary">Sin activos registrados.</Typography>
                        )}
                    </Card>
                </Box>
            </Box>
        </Box>
    )
}
