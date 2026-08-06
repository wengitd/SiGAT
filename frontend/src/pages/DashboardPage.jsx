import { useEffect, useRef, useState } from "react"
import {
    Box, Card, Typography, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem,
} from "@mui/material"
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

const ANIO_ACTUAL = new Date().getFullYear()
const ANIOS = Array.from({ length: 6 }, (_, i) => ANIO_ACTUAL - i)

export default function DashboardPage() {
    const [anio, setAnio] = useState(ANIO_ACTUAL)
    const [resumen, setResumen] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState(null)
    const yaCargoRef = useRef(false)

    useEffect(() => {
        let cancelled = false

        if (!yaCargoRef.current) {
            setLoading(true)
        } else {
            setRefreshing(true)
        }
        setError(null)

        getResumenDashboard(anio)
            .then((data) => {
                if (!cancelled) {
                    setResumen(data)
                    yaCargoRef.current = true
                }
            })
            .catch(() => {
                if (!cancelled) setError("No se pudo cargar el resumen del dashboard.")
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false)
                    setRefreshing(false)
                }
            })

        return () => { cancelled = true }
    }, [anio])

    if (loading && !resumen) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error && !resumen) {
        return <Alert severity="error">{error}</Alert>
    }

    const anioLabel = resumen?.anio ?? anio
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
        <Box sx={{ position: "relative" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 3, flexWrap: "wrap" }}>
                <Typography variant="h5">Dashboard</Typography>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="dashboard-anio-label">Periodo</InputLabel>
                    <Select
                        labelId="dashboard-anio-label"
                        label="Periodo"
                        value={anio}
                        onChange={(e) => setAnio(Number(e.target.value))}
                        disabled={refreshing}
                    >
                        {ANIOS.map((y) => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {refreshing && (
                <Box sx={{ position: "absolute", top: 56, right: 0, zIndex: 1 }}>
                    <CircularProgress size={22} />
                </Box>
            )}

            <Box sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
                gap: 3,
                opacity: refreshing ? 0.65 : 1,
                transition: "opacity 0.2s",
                pointerEvents: refreshing ? "none" : "auto",
            }}>
                {/* Columna izquierda */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                        <StatCard icon={ComputerOutlinedIcon} value={activos.equipo_computo} label={`Activos computacionales en ${anioLabel}`} color="#1B6B5A" />
                        <StatCard icon={PrintOutlinedIcon} value={activos.periferico} label={`Activos periféricos en ${anioLabel}`} color="#0288D1" />
                        <StatCard icon={EventOutlinedIcon} value={activos.adquiridos_anio} label={`Activos adquiridos en ${anioLabel}`} color="#4CAF8F" />
                    </Box>

                    {licencias_totales.length > 0 && (
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: `repeat(${Math.min(licencias_totales.length, 3)}, 1fr)` }, gap: 2 }}>
                            {licencias_totales.map((l, i) => (
                                <StatCard
                                    key={l.proveedor}
                                    icon={VpnKeyOutlinedIcon}
                                    value={l.total}
                                    label={`Licencias ${l.proveedor} en ${anioLabel}`}
                                    color={PALETA[i % PALETA.length]}
                                />
                            ))}
                        </Box>
                    )}

                    <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            Licencias asignadas por mes — {anioLabel}
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
                            <Typography color="text.secondary">Sin licencias asignadas registradas en {anioLabel}.</Typography>
                        )}
                    </Card>
                </Box>

                {/* Columna derecha */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            Sistemas operativos — {anioLabel}
                        </Typography>
                        {dataSO.length > 0 ? (
                            <PieChart series={[{ data: dataSO, innerRadius: 30 }]} height={260} />
                        ) : (
                            <Typography color="text.secondary">Sin equipos con sistema operativo registrados en {anioLabel}.</Typography>
                        )}
                    </Card>

                    <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            Activos por estado — {anioLabel}
                        </Typography>
                        {dataEstado.length > 0 ? (
                            <PieChart series={[{ data: dataEstado, innerRadius: 30 }]} height={260} />
                        ) : (
                            <Typography color="text.secondary">Sin activos registrados en {anioLabel}.</Typography>
                        )}
                    </Card>
                </Box>
            </Box>
        </Box>
    )
}
