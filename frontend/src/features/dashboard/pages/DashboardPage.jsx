import { useState } from "react"
import {
    Box, Card, Typography, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem,
} from "@mui/material"
import { PieChart } from "@mui/x-charts/PieChart"
import { BarChart } from "@mui/x-charts/BarChart"

import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import ComputerOutlinedIcon from "@mui/icons-material/ComputerOutlined"
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined"
import RemoveCircleOutlinedIcon from "@mui/icons-material/RemoveCircleOutlined"
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined"

import useDashboard from "../hooks/useDashboard"
import StatCard from "../components/StatCard"

const PALETA = ["#1B6B5A", "#0288D1", "#4CAF8F", "#ED6C02", "#7C6FE0", "#D32F2F"]

const COLOR_ESTADO = {
    Bueno: "#2E7D32",
    Regular: "#7C6FE0",
    Malo: "#ED6C02",
    "De baja": "#D32F2F",
}

const ANIO_ACTUAL = new Date().getFullYear()
const ANIOS = Array.from({ length: 6 }, (_, i) => ANIO_ACTUAL - i)

function tieneValores(items, campo = "total") {
    return Array.isArray(items) && items.some((item) => (item[campo] ?? 0) > 0)
}

export default function DashboardPage() {
    const [anio, setAnio] = useState(null)
    const { resumen, loading, refreshing, error } = useDashboard(anio)

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

    const anioLabel = anio ? `en ${anio}` : ""
    const {
        activos = {},
        activos_por_tipo = [],
        activos_por_antiguedad = [],
        licencias_por_tipo = [],
        activos_por_estado = [],
    } = resumen

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
                        value={anio ?? ""}
                        onChange={(e) => setAnio(e.target.value ? Number(e.target.value):null)}
                        disabled={refreshing}
                    >
                        <MenuItem value="">Todos</MenuItem>

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
                display: "flex",
                flexDirection: "column",
                gap: 3,
                opacity: refreshing ? 0.65 : 1,
                transition: "opacity 0.2s",
                pointerEvents: refreshing ? "none" : "auto",
            }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
                    <StatCard
                        icon={Inventory2OutlinedIcon}
                        value={activos.total}
                        label={`Total de activos ${anioLabel}`}
                        color="#1B6B5A"
                    />
                    <StatCard
                        icon={ComputerOutlinedIcon}
                        value={activos.equipos_disponibles}
                        label={`Equipos computacionales disponibles ${anioLabel}`}
                        color="#0288D1"
                    />
                    <StatCard
                        icon={AssignmentIndOutlinedIcon}
                        value={activos.equipos_asignados}
                        label={`Equipos computacionales asignados ${anioLabel}`}
                        color="#4CAF8F"
                    />
                    <StatCard
                        icon={RemoveCircleOutlinedIcon}
                        value={activos.dados_de_baja}
                        label={`Total activos dados de baja  ${anioLabel}`}
                        color="#D32F2F"
                    />
                </Box>

                <Box sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
                    gap: 3,
                }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <Card sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                Distribución de activos por tipo  {anioLabel}
                            </Typography>
                            {tieneValores(activos_por_tipo) ? (
                                <BarChart
                                    height={280}
                                    hideLegend
                                    xAxis={[{ scaleType: "band", data: activos_por_tipo.map((t) => t.tipo) }]}
                                    series={[{
                                        data: activos_por_tipo.map((t) => t.total),
                                        color: PALETA[0],
                                    }]}
                                />
                            ) : (
                                <Typography color="text.secondary">
                                    Sin activos registrados {anioLabel}.
                                </Typography>
                            )}
                        </Card>

                        <Card sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                Activos por antigüedad {anioLabel}
                            </Typography>
                            {tieneValores(activos_por_antiguedad) ? (
                                <BarChart
                                    height={280}
                                    hideLegend
                                    xAxis={[{ scaleType: "band", data: activos_por_antiguedad.map((a) => a.rango) }]}
                                    series={[{
                                        data: activos_por_antiguedad.map((a) => a.total),
                                        color: PALETA[1],
                                    }]}
                                />
                            ) : (
                                <Typography color="text.secondary">
                                    Sin activos con fecha de recepción en {anioLabel}.
                                </Typography>
                            )}
                        </Card>

                        <Box>
                            <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
                                Total licencias por tipo {anioLabel}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Asignadas / total equipos de cómputo
                            </Typography>
                            {licencias_por_tipo.length > 0 ? (
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: `repeat(${Math.min(licencias_por_tipo.length, 3)}, 1fr)` }, gap: 2 }}>
                                    {licencias_por_tipo.map((l, i) => (
                                        <StatCard
                                            key={l.tipo}
                                            icon={VpnKeyOutlinedIcon}
                                            value={`${l.asignadas} / ${l.total_equipos_computo}`}
                                            label={`Licencias ${l.tipo}`}
                                            color={PALETA[i % PALETA.length]}
                                        />
                                    ))}
                                </Box>
                            ) : (
                                <Typography color="text.secondary">
                                    Sin tipos de licencia registrados.
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    <Box>
                        <Card sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                Activos por estado {anioLabel}
                            </Typography>
                            {tieneValores(activos_por_estado) ? (
                                <PieChart
                                    series={[{ data: dataEstado, innerRadius: 30 }]}
                                    height={320}
                                />
                            ) : (
                                <Typography color="text.secondary">
                                    Sin activos registrados {anioLabel}.
                                </Typography>
                            )}
                        </Card>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}
