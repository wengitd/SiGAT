import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import useActivos from "../hooks/useActivos"
import useBuscador from "../hooks/useBuscador"
import { devolverAsignacion } from "../services/asignacionService"
import { useAuth } from "../context/AuthContext"
import { useDialog } from "../context/DialogContext"

import {
    Box, Typography, Chip, Link, Button, IconButton, Tooltip,
} from "@mui/material"
import { DataGrid } from "@mui/x-data-grid"

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined"
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt"
import SwapHorizIcon from "@mui/icons-material/SwapHoriz"
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn"
import HistoryIcon from "@mui/icons-material/History"
import AddIcon from "@mui/icons-material/Add"
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck"
import BuildCircleIcon from "@mui/icons-material/BuildCircle"

import BuscadorActivos from "../components/BuscadorActivos"
import FiltroActivos from "../components/FiltroActivos"
import AsignacionModal from "../components/AsignacionModal"
import NuevoActivoDialog from "../components/NuevoActivoDialog"
import ActivoDetalleDrawer from "../components/ActivoDetalleDrawer"
import ChecklistEjecucionDialog from "../components/ChecklistEjecucionDialog"

const CAMPOS_BUSQUEDA = [
    "nombre_marca", "nombre_modelo", "num_serie", "host_name",
    "nombre_dispo", "nombre_estado", "empleado_asignado", "tipo_label", "nombre_so",
]

export default function InventarioPage() {
    const navigate = useNavigate()
    const { isEditor } = useAuth()
    const { confirm, alert: showAlert } = useDialog()
    const { activos, loading, refetch } = useActivos()

    const [activoAAsignar, setActivoAAsignar] = useState(null)
    const [activoDetalle, setActivoDetalle] = useState(null)
    const [dialogCrearOpen, setDialogCrearOpen] = useState(false)
    const [checklistCtx, setChecklistCtx] = useState(null)

    // Etiqueta legible para filtrar por tipo (Computacional / Periférico)
    const activosConLabel = useMemo(
        () => activos.map(a => ({
            ...a,
            tipo_label: a.tipo === "equipo_computo" ? "Computacional" : "Periférico",
        })),
        [activos],
    )

    const { busqueda, setBusqueda, filtros, setFiltro, limpiarFiltros, filasFiltradas } =
        useBuscador(activosConLabel, CAMPOS_BUSQUEDA)

    const opcionesTipo = ["Computacional", "Periférico"]
    const opcionesDispo = useMemo(
        () => [...new Set(activos.map(a => a.nombre_dispo).filter(Boolean))],
        [activos],
    )
    const opcionesEstado = useMemo(
        () => [...new Set(activos.map(a => a.nombre_estado).filter(Boolean))],
        [activos],
    )

    const hayFiltrosActivos = Boolean(busqueda || Object.values(filtros).some(v => v))

    async function handleDevolver(row) {
        if (!row.id_asig_actual) return
        const ok = await confirm({
            title: "Confirmar devolución",
            message: `¿Confirmas la devolución del activo "${row.nombre_marca ?? ""} ${row.nombre_modelo ?? ""}" actualmente asignado a ${row.empleado_asignado}?`,
            severity: "warning",
            confirmText: "Devolver activo",
        })
        if (!ok) return

        const hoyStr = new Date().toISOString().slice(0, 10)
        try {
            await devolverAsignacion(row.id_asig_actual, hoyStr)
            refetch()
        } catch (err) {
            await showAlert({
                title: "Error de devolución",
                message: err.response?.data?.detail ?? "Error al registrar devolución",
                severity: "error",
            })
        }
    }

    function abrirChecklist(row, proposito) {
        setChecklistCtx({ activo: row, proposito })
    }

    const columns = [
        {
            field: "acciones",
            headerName: "Acciones",
            width: 260,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const esComputacional = params.row.tipo === "equipo_computo"
                return (
                    <Box sx={{ display: "flex", gap: 0.25, alignItems: "center", height: "100%" }}>
                        <Tooltip title="Ver detalle">
                            <IconButton size="small" onClick={() => setActivoDetalle(params.row)}>
                                <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        {isEditor && esComputacional && !params.row.empleado_asignado && params.row.nombre_dispo?.toLowerCase() !== "de_baja" && (
                            <Tooltip title="Preparar equipo">
                                <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => abrirChecklist(params.row, "preparacion")}
                                >
                                    <BuildCircleIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        {isEditor && esComputacional && params.row.empleado_asignado && params.row.nombre_dispo?.toLowerCase() !== "de_baja" && (
                            <Tooltip title="Preparar reasignación">
                                <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => abrirChecklist(params.row, "reasignacion")}
                                >
                                    <PlaylistAddCheckIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        {isEditor && params.row.nombre_dispo?.toLowerCase() !== "de_baja" && (
                            !params.row.empleado_asignado ? (
                                <Tooltip title="Asignar">
                                    <IconButton size="small" color="primary" onClick={() => setActivoAAsignar(params.row)}>
                                        <PersonAddAltIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            ) : (
                                <>
                                    <Tooltip title="Reasignar">
                                        <IconButton size="small" color="warning" onClick={() => setActivoAAsignar(params.row)}>
                                            <SwapHorizIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Devolver">
                                        <IconButton size="small" color="error" onClick={() => handleDevolver(params.row)}>
                                            <AssignmentReturnIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            )
                        )}

                        <Tooltip title="Trazabilidad">
                            <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => navigate(`/trazabilidad?tipo=activo&id=${params.row.id_act}`)}
                            >
                                <HistoryIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )
            },
        },
        { field: "id_act", headerName: "ID", width: 70 },
        { field: "nombre_marca", headerName: "Marca", width: 130 },
        { field: "nombre_modelo", headerName: "Modelo", width: 130 },
        { field: "num_serie", headerName: "Número de Serie", width: 160 },
        {
            field: "nombre_dispo", headerName: "Disponibilidad", width: 130,
            renderCell: (params) => (
                <Chip
                    label={params.value ?? "Sin datos"}
                    color={params.row.dispo_color ?? "default"}
                    size="small"
                />
            ),
        },
        { field: "origen", headerName: "Origen", width: 90 },
        {
            field: "ruta_pdf_fact", headerName: "Factura", width: 90,
            renderCell: (params) => params.value
                ? <Link href={params.value} target="_blank" rel="noreferrer" sx={{ fontSize: 14, textDecoration: "none" }}>Ver PDF</Link>
                : "—",
        },
        { field: "tipo_label", headerName: "Tipo", width: 130 },
        { field: "nombre_so", headerName: "Sistema Operativo", width: 140 },
        { field: "nombre_estado", headerName: "Estado", width: 110 },
        {
            field: "empleado_asignado", headerName: "Asignado a", width: 160,
            valueFormatter: (value) => value ?? "— Sin asignar",
        },

    ]

    if (loading) return <p>Cargando...</p>

    return (
        <Box
            component="section"
            sx={{
                // Resta el padding vertical del Layout (p: 3 → 24px arriba + abajo)
                height: "calc(100vh - 48px)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxSizing: "border-box",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, flexShrink: 0 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                        Inventario
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Total: {filasFiltradas.length} de {activos.length} activos
                    </Typography>
                </Box>

                {isEditor && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setDialogCrearOpen(true)}
                    >
                        Crear activo
                    </Button>
                )}
            </Box>

            <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
                <BuscadorActivos
                    value={busqueda}
                    onChange={setBusqueda}
                    placeholder="Buscar por marca, modelo, serie, host..."
                />
                <FiltroActivos
                    label="Tipo"
                    opciones={opcionesTipo}
                    value={filtros.tipo_label ?? ""}
                    onChange={v => setFiltro("tipo_label", v)}
                />
                <FiltroActivos
                    label="Disponibilidad"
                    opciones={opcionesDispo}
                    value={filtros.nombre_dispo ?? ""}
                    onChange={v => setFiltro("nombre_dispo", v)}
                />
                <FiltroActivos
                    label="Estado"
                    opciones={opcionesEstado}
                    value={filtros.nombre_estado ?? ""}
                    onChange={v => setFiltro("nombre_estado", v)}
                />
                {hayFiltrosActivos && (
                    <Button size="small" color="inherit" onClick={limpiarFiltros}>
                        Limpiar filtros
                    </Button>
                )}
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, mt: 2 }}>
                <DataGrid
                    rows={filasFiltradas}
                    columns={columns}
                    getRowId={(row) => row.id_act}
                />
            </Box>

            <AsignacionModal
                open={!!activoAAsignar}
                onClose={() => setActivoAAsignar(null)}
                activoFijo={activoAAsignar
                    ? {
                        id_act: activoAAsignar.id_act,
                        tipo: activoAAsignar.tipo,
                        empleado_asignado: activoAAsignar.empleado_asignado,
                        nombre_marca: activoAAsignar.nombre_marca,
                        nombre_modelo: activoAAsignar.nombre_modelo,
                        label: `${activoAAsignar.nombre_marca ?? ""} ${activoAAsignar.nombre_modelo ?? ""} — N° serie ${activoAAsignar.num_serie ?? "s/n"}`,
                    }
                    : null}
                onAsignado={refetch}
                onAbrirChecklist={(proposito, idAct) => {
                    const row = activoAAsignar?.id_act === idAct
                        ? activoAAsignar
                        : activos.find((a) => a.id_act === idAct)
                    setActivoAAsignar(null)
                    if (row) abrirChecklist(row, proposito)
                }}
            />

            <NuevoActivoDialog
                open={dialogCrearOpen}
                onClose={() => setDialogCrearOpen(false)}
                onCreado={refetch}
            />

            <ActivoDetalleDrawer
                open={!!activoDetalle}
                onClose={() => setActivoDetalle(null)}
                activo={activoDetalle}
                onPreparar={isEditor ? (proposito) => {
                    const row = activoDetalle
                    setActivoDetalle(null)
                    if (row) abrirChecklist(row, proposito)
                } : undefined}
            />

            <ChecklistEjecucionDialog
                open={!!checklistCtx}
                onClose={() => setChecklistCtx(null)}
                activo={checklistCtx?.activo}
                proposito={checklistCtx?.proposito}
                onCompletado={refetch}
            />
        </Box>
    )
}
