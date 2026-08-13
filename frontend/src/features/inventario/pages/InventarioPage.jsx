import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import useActivos from "../hooks/useActivos"
import useBuscador from "../hooks/useBuscador"
import { devolverAsignacion } from "../../asignaciones/api"
import { deleteActivo } from "../api"
import { getDisponibilidades, getTiposEstado } from "../../catalogos/api"
import { useAuth } from "../../../core/auth/AuthContext"
import { useDialog } from "../../../core/dialog/DialogContext"

import {
    Box, Typography, Chip, Button, IconButton, Tooltip, TextField,
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
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf"
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined"

import BuscadorActivos from "../../../shared/ui/BuscadorActivos"
import FiltroActivos from "../../../shared/ui/FiltroActivos"
import AsignacionModal from "../../asignaciones/components/AsignacionModal"
import NuevoActivoDialog from "../components/NuevoActivoDialog"
import EditarEstadoDispoDialog from "../components/EditarEstadoDispoDialog"
import ActivoDetalleDrawer from "../components/ActivoDetalleDrawer"
import ChecklistEjecucionDialog from "../../checklist/components/ChecklistEjecucionDialog"
import FacturaPdfDialog from "../../facturas/components/FacturaPdfDialog"
import ActaEntregaDialog from "../../asignaciones/components/ActaEntregaDialog"

const CAMPOS_BUSQUEDA = [
    "nombre_marca", "nombre_modelo", "num_serie", "host_name",
    "nombre_dispo", "nombre_estado", "empleado_asignado", "tipo_label", "nombre_so",
]

const FILTROS_API_INICIAL = { tipo: "", id_dispo: "", id_tipoe: "", mac: "" }

export default function InventarioPage() {
    const navigate = useNavigate()
    const { isEditor } = useAuth()
    const { confirm, alert: showAlert } = useDialog()

    const [filtrosApi, setFiltrosApi] = useState({ ...FILTROS_API_INICIAL })
    const [macInput, setMacInput] = useState("")
    const [tiposEstado, setTiposEstado] = useState([])
    const [disponibilidades, setDisponibilidades] = useState([])

    // Debounce del filtro MAC antes de consultar la API
    useEffect(() => {
        const t = setTimeout(() => {
            setFiltrosApi(prev => (prev.mac === macInput ? prev : { ...prev, mac: macInput }))
        }, 300)
        return () => clearTimeout(t)
    }, [macInput])

    useEffect(() => {
        getTiposEstado().then(setTiposEstado).catch(() => setTiposEstado([]))
        getDisponibilidades().then(setDisponibilidades).catch(() => setDisponibilidades([]))
    }, [])

    const paramsApi = useMemo(() => ({
        tipo: filtrosApi.tipo || undefined,
        id_dispo: filtrosApi.id_dispo !== "" ? Number(filtrosApi.id_dispo) : undefined,
        id_tipoe: filtrosApi.id_tipoe !== "" ? Number(filtrosApi.id_tipoe) : undefined,
        mac: filtrosApi.mac.trim() || undefined,
    }), [filtrosApi])

    const { activos, loading, refetch } = useActivos(paramsApi)
    const [listo, setListo] = useState(false)
    useEffect(() => {
        if (!loading) setListo(true)
    }, [loading])

    const [activoAAsignar, setActivoAAsignar] = useState(null)
    const [activoAEditarEstado, setActivoAEditarEstado] = useState(null)
    const [activoDetalle, setActivoDetalle] = useState(null)
    const [dialogCrearOpen, setDialogCrearOpen] = useState(false)
    const [checklistCtx, setChecklistCtx] = useState(null)
    const [facturaDialog, setFacturaDialog] = useState(null)
    const [actaDialogId, setActaDialogId] = useState(null)

    // Etiqueta legible para búsqueda local por tipo
    const activosConLabel = useMemo(
        () => activos.map(a => ({
            ...a,
            tipo_label: a.tipo === "Equipo Computo" ? "Computacional" : "Periférico",
        })),
        [activos],
    )

    // Solo búsqueda de texto libre en cliente; filtros exactos van a la API
    const { busqueda, setBusqueda, limpiarFiltros: limpiarBusqueda, filasFiltradas } =
        useBuscador(activosConLabel, CAMPOS_BUSQUEDA)

    const opcionesTipo = [
        { value: "Equipo Computo", label: "Computacional" },
        { value: "Periferico", label: "Periférico" },
    ]
    const opcionesDispo = useMemo(
        () => disponibilidades.map(d => ({ value: d.id_dispo, label: d.nombre })),
        [disponibilidades],
    )
    const opcionesEstado = useMemo(
        () => tiposEstado.map(t => ({ value: t.id_tipoe, label: t.nombre })),
        [tiposEstado],
    )

    const hayFiltrosApi = Boolean(
        filtrosApi.tipo || filtrosApi.id_dispo !== "" || filtrosApi.id_tipoe !== "" || macInput.trim(),
    )
    const hayFiltrosActivos = Boolean(busqueda || hayFiltrosApi)

    function limpiarFiltros() {
        setFiltrosApi({ ...FILTROS_API_INICIAL })
        setMacInput("")
        limpiarBusqueda()
    }

    function setFiltroApi(campo, valor) {
        setFiltrosApi(prev => ({ ...prev, [campo]: valor }))
    }

    function handleRowDoubleClick(params, event) {
        if (event?.target?.closest?.("button, .MuiIconButton-root, a")) return
        if (isEditor) {
            setActivoAEditarEstado(params.row)
        } else {
            setActivoDetalle(params.row)
        }
    }

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

    async function handleEliminar(row) {
        const etiqueta = [row.nombre_marca, row.nombre_modelo, row.num_serie]
            .filter(Boolean)
            .join(" ")
        const ok = await confirm({
            title: "Eliminar activo",
            message: `¿Eliminar permanentemente el activo "${etiqueta || row.id_act}"? Esta acción no se puede deshacer.`,
            severity: "warning",
            confirmText: "Eliminar",
        })
        if (!ok) return

        try {
            await deleteActivo(row.id_act)
            refetch()
        } catch (err) {
            await showAlert({
                title: "Error al eliminar",
                message: err.response?.data?.detail ?? "Error al eliminar el activo",
                severity: "error",
            })
        }
    }

    const columns = [
        {
            field: "acciones",
            headerName: "Acciones",
            width: 320,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const esComputacional = params.row.tipo === "Equipo Computo"
                const tieneFactura = Boolean(params.row.id_fact)
                return (
                    <Box sx={{ display: "flex", gap: 0.25, alignItems: "center", height: "100%" }}>
                        <Tooltip title="Ver detalle">
                            <IconButton size="small" onClick={() => setActivoDetalle(params.row)}>
                                <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        {tieneFactura && (
                            <Tooltip title="Ver factura">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setFacturaDialog({
                                        id_fact: params.row.id_fact,
                                        fecha_em: params.row.fecha_em_fact,
                                    })}
                                >
                                    <PictureAsPdfIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        {isEditor && esComputacional && !params.row.empleado_asignado && (
                            <Tooltip title="Preparar equipo">
                                <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => abrirChecklist(params.row, "Preparacion")}
                                >
                                    <BuildCircleIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        {isEditor && esComputacional && params.row.empleado_asignado && (
                            <Tooltip title="Preparar reasignación">
                                <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => abrirChecklist(params.row, "Reasignacion")}
                                >
                                    <PlaylistAddCheckIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        {isEditor && params.row.nombre_dispo?.toLowerCase() !== "de baja" && (
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

                        {isEditor && params.row.puede_eliminar && (
                            <Tooltip title="Eliminar">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleEliminar(params.row)}
                                >
                                    <DeleteOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
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
        { field: "tipo_label", headerName: "Tipo", width: 130 },
        { field: "nombre_estado", headerName: "Estado", width: 110 },
        {
            field: "empleado_asignado", headerName: "Asignado a", width: 160,
            valueFormatter: (value) => value ?? "— Sin asignar",
        },

    ]

    if (loading && !listo) return <p>Cargando...</p>

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
                    {isEditor && (
                        <Typography variant="caption" color="text.secondary">
                            Doble clic en una fila para editar estado y disponibilidad.
                        </Typography>
                    )}
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
                    value={filtrosApi.tipo}
                    onChange={v => setFiltroApi("tipo", v)}
                />
                <FiltroActivos
                    label="Disponibilidad"
                    opciones={opcionesDispo}
                    value={filtrosApi.id_dispo === "" ? "" : String(filtrosApi.id_dispo)}
                    onChange={v => setFiltroApi("id_dispo", v)}
                />
                <FiltroActivos
                    label="Estado"
                    opciones={opcionesEstado}
                    value={filtrosApi.id_tipoe === "" ? "" : String(filtrosApi.id_tipoe)}
                    onChange={v => setFiltroApi("id_tipoe", v)}
                />
                <TextField
                    size="small"
                    label="MAC"
                    placeholder="AA:BB:CC…"
                    value={macInput}
                    onChange={e => setMacInput(e.target.value)}
                    sx={{ minWidth: 160 }}
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
                    loading={loading}
                    onRowDoubleClick={handleRowDoubleClick}
                    sx={{
                        "& .MuiDataGrid-row": { cursor: "pointer" },
                    }}
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

            <EditarEstadoDispoDialog
                open={!!activoAEditarEstado}
                onClose={() => setActivoAEditarEstado(null)}
                activo={activoAEditarEstado}
                onGuardado={refetch}
            />

            <ActivoDetalleDrawer
                open={!!activoDetalle}
                onClose={() => setActivoDetalle(null)}
                activo={activoDetalle}
                onVerFactura={activoDetalle?.id_fact
                    ? () => setFacturaDialog({
                        id_fact: activoDetalle.id_fact,
                        fecha_em: activoDetalle.fecha_em_fact,
                    })
                    : undefined}
                onVerActa={activoDetalle?.id_asig_actual
                    ? () => setActaDialogId(activoDetalle.id_asig_actual)
                    : undefined}
                onPreparar={isEditor ? (proposito) => {
                    const row = activoDetalle
                    setActivoDetalle(null)
                    if (row) abrirChecklist(row, proposito)
                } : undefined}
            />

            <FacturaPdfDialog
                open={!!facturaDialog}
                onClose={() => setFacturaDialog(null)}
                idFact={facturaDialog?.id_fact}
                fechaEm={facturaDialog?.fecha_em}
                onReemplazado={(actualizada) => {
                    refetch()
                    if (actualizada?.fecha_em != null) {
                        setFacturaDialog(prev => prev
                            ? { ...prev, fecha_em: actualizada.fecha_em }
                            : prev)
                        setActivoDetalle(prev => prev?.id_fact === actualizada.id_fact
                            ? { ...prev, fecha_em_fact: actualizada.fecha_em }
                            : prev)
                    }
                }}
            />

            <ActaEntregaDialog
                open={!!actaDialogId}
                onClose={() => setActaDialogId(null)}
                idAsig={actaDialogId}
                onReemplazado={() => {
                    refetch()
                    setActivoDetalle(prev => prev
                        ? { ...prev, tiene_acta_entr: true }
                        : prev)
                }}
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
