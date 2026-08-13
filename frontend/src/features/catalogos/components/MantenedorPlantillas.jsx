import { useState, useEffect, useMemo } from "react"
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControlLabel, Switch, Checkbox, IconButton, Tooltip, CircularProgress,
    Alert, Chip, Tabs, Tab, Stack,
} from "@mui/material"
import { DataGrid } from "@mui/x-data-grid"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import {
    getPlantillas, crearPlantilla, actualizarPlantilla, agregarPaso, actualizarPaso,
} from "../../checklist/api"
import { useAuth } from "../../../core/auth/AuthContext"
import { useDialog } from "../../../core/dialog/DialogContext"

const LABELS = {
    Preparacion: "Preparación",
    Reasignacion: "Reasignación",
}

function TabPlantilla({ proposito, plantillas, onRefresh, isEditor }) {
    const { alert: showAlert } = useDialog()
    const delProposito = useMemo(
        () => plantillas.filter((p) => p.proposito === proposito),
        [plantillas, proposito],
    )

    const [selectedId, setSelectedId] = useState(null)
    const plantilla = delProposito.find((p) => p.id_plantilla === selectedId) ?? delProposito[0] ?? null

    useEffect(() => {
        if (!delProposito.length) {
            setSelectedId(null)
            return
        }
        if (!delProposito.some((p) => p.id_plantilla === selectedId)) {
            setSelectedId(delProposito[0].id_plantilla)
        }
    }, [delProposito, selectedId])

    const [createOpen, setCreateOpen] = useState(false)
    const [editHeaderOpen, setEditHeaderOpen] = useState(false)
    const [nombre, setNombre] = useState("")
    const [vigente, setVigente] = useState(true)
    const [saving, setSaving] = useState(false)

    const [pasoOpen, setPasoOpen] = useState(false)
    const [editPaso, setEditPaso] = useState(null)
    const [pasoDescr, setPasoDescr] = useState("")
    const [pasoOrden, setPasoOrden] = useState(1)
    const [pasoActivo, setPasoActivo] = useState(true)

    function openCreate() {
        setNombre("")
        setVigente(true)
        setCreateOpen(true)
    }

    function openEditHeader(row) {
        setSelectedId(row.id_plantilla)
        setNombre(row.nombre)
        setVigente(row.vigente)
        setEditHeaderOpen(true)
    }

    async function guardarNueva() {
        if (!nombre.trim()) return
        setSaving(true)
        try {
            const creada = await crearPlantilla({
                nombre: nombre.trim(),
                proposito,
                vigente,
                pasos: [
                    { descr: "Paso inicial (editar)", orden: 1, activo: true },
                ],
            })
            setCreateOpen(false)
            await onRefresh()
            setSelectedId(creada.id_plantilla)
        } catch (err) {
            await showAlert({
                title: "Error",
                message: err.response?.data?.detail ?? "No se pudo crear la plantilla",
                severity: "error",
            })
        } finally {
            setSaving(false)
        }
    }

    async function guardarHeader() {
        if (!plantilla) return
        setSaving(true)
        try {
            await actualizarPlantilla(plantilla.id_plantilla, { nombre, vigente })
            setEditHeaderOpen(false)
            onRefresh()
        } catch (err) {
            await showAlert({
                title: "Error",
                message: err.response?.data?.detail ?? "No se pudo guardar la plantilla",
                severity: "error",
            })
        } finally {
            setSaving(false)
        }
    }

    function openCreatePaso() {
        if (!plantilla) return
        const maxOrden = Math.max(0, ...(plantilla.pasos ?? []).map((p) => p.orden))
        setEditPaso(null)
        setPasoDescr("")
        setPasoOrden(maxOrden + 1)
        setPasoActivo(true)
        setPasoOpen(true)
    }

    function openEditPaso(row) {
        setEditPaso(row)
        setPasoDescr(row.descr)
        setPasoOrden(row.orden)
        setPasoActivo(row.activo)
        setPasoOpen(true)
    }

    async function guardarPaso() {
        if (!plantilla || !pasoDescr.trim()) return
        setSaving(true)
        try {
            if (editPaso) {
                await actualizarPaso(editPaso.id_paso, {
                    descr: pasoDescr.trim(),
                    orden: Number(pasoOrden),
                    activo: pasoActivo,
                })
            } else {
                await agregarPaso(plantilla.id_plantilla, {
                    descr: pasoDescr.trim(),
                    orden: Number(pasoOrden),
                    activo: true,
                })
            }
            setPasoOpen(false)
            onRefresh()
        } catch (err) {
            await showAlert({
                title: "Error",
                message: err.response?.data?.detail ?? "No se pudo guardar el paso",
                severity: "error",
            })
        } finally {
            setSaving(false)
        }
    }

    const plantillaColumns = [
        { field: "id_plantilla", headerName: "ID", width: 70 },
        { field: "nombre", headerName: "Nombre", flex: 1, minWidth: 220 },
        {
            field: "vigente",
            headerName: "Vigente",
            width: 110,
            renderCell: (p) => (
                <Chip size="small" label={p.value ? "Sí" : "Archivada"} color={p.value ? "success" : "default"} />
            ),
        },
        {
            field: "pasos_n",
            headerName: "Pasos",
            width: 80,
            valueGetter: (_v, row) => (row.pasos ?? []).filter((x) => x.activo).length,
        },
        {
            field: "__acc",
            headerName: "",
            width: 70,
            sortable: false,
            renderCell: (p) => (isEditor ? (
                <Tooltip title="Editar">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEditHeader(p.row) }}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            ) : null),
        },
    ]

    const pasos = [...(plantilla?.pasos ?? [])].sort((a, b) => a.orden - b.orden)

    const pasoColumns = [
        { field: "orden", headerName: "Orden", width: 80 },
        { field: "descr", headerName: "Descripción", flex: 1, minWidth: 280 },
        {
            field: "activo",
            headerName: "Activo",
            width: 100,
            renderCell: (p) => (
                <Chip size="small" label={p.value ? "Sí" : "No"} color={p.value ? "success" : "default"} />
            ),
        },
        {
            field: "__acc",
            headerName: "",
            width: 70,
            sortable: false,
            renderCell: (p) => (isEditor ? (
                <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => openEditPaso(p.row)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            ) : null),
        },
    ]

    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
                    Plantillas de {LABELS[proposito]}
                </Typography>
                {isEditor && (
                    <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                        Nueva plantilla
                    </Button>
                )}
            </Stack>

            {delProposito.length === 0 ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    No hay plantillas de {LABELS[proposito]}. Cree una para poder usarla en Inventario.
                </Alert>
            ) : (
                <DataGrid
                    rows={delProposito}
                    columns={plantillaColumns}
                    getRowId={(r) => r.id_plantilla}
                    autoHeight
                    disableRowSelectionOnClick
                    onRowClick={(params) => setSelectedId(params.row.id_plantilla)}
                    getRowClassName={(params) => (
                        params.row.id_plantilla === plantilla?.id_plantilla ? "Mui-selected" : ""
                    )}
                    pageSizeOptions={[5, 10]}
                    initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                    sx={{ mb: 3 }}
                />
            )}

            {plantilla && (
                <>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                        <Typography variant="subtitle2" fontWeight={700}>
                            Pasos: {plantilla.nombre}
                        </Typography>
                        {isEditor && (
                            <Button size="small" startIcon={<AddIcon />} onClick={openCreatePaso}>
                                Agregar paso
                            </Button>
                        )}
                    </Stack>
                    <DataGrid
                        rows={pasos}
                        columns={pasoColumns}
                        getRowId={(r) => r.id_paso}
                        autoHeight
                        disableRowSelectionOnClick
                        pageSizeOptions={[10, 25]}
                        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    />
                </>
            )}

            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Nueva plantilla — {LABELS[proposito]}</DialogTitle>
                <DialogContent sx={{ pt: "16px !important", display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        label="Nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        fullWidth
                        size="small"
                        autoFocus
                    />
                    <FormControlLabel
                        control={<Switch checked={vigente} onChange={(e) => setVigente(e.target.checked)} />}
                        label="Disponible para usar (vigente)"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)} disabled={saving}>Cancelar</Button>
                    <Button variant="contained" onClick={guardarNueva} disabled={saving || !nombre.trim()}>
                        {saving ? <CircularProgress size={18} /> : "Crear"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={editHeaderOpen} onClose={() => setEditHeaderOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Editar plantilla</DialogTitle>
                <DialogContent sx={{ pt: "16px !important", display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        label="Nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        fullWidth
                        size="small"
                    />
                    <FormControlLabel
                        control={<Switch checked={vigente} onChange={(e) => setVigente(e.target.checked)} />}
                        label="Disponible para usar (vigente)"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditHeaderOpen(false)} disabled={saving}>Cancelar</Button>
                    <Button variant="contained" onClick={guardarHeader} disabled={saving || !nombre.trim()}>
                        {saving ? <CircularProgress size={18} /> : "Guardar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={pasoOpen} onClose={() => setPasoOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editPaso ? "Editar paso" : "Nuevo paso"}</DialogTitle>
                <DialogContent sx={{ pt: "16px !important", display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        label="Descripción"
                        value={pasoDescr}
                        onChange={(e) => setPasoDescr(e.target.value)}
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                    />
                    <TextField
                        label="Orden"
                        type="number"
                        value={pasoOrden}
                        onChange={(e) => setPasoOrden(e.target.value)}
                        fullWidth
                        size="small"
                        slotProps={{ htmlInput: { min: 1 } }}
                    />
                    {editPaso && (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={pasoActivo}
                                    onChange={(e) => setPasoActivo(e.target.checked)}
                                />
                            }
                            label="Activo"
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPasoOpen(false)} disabled={saving}>Cancelar</Button>
                    <Button variant="contained" onClick={guardarPaso} disabled={saving || !pasoDescr.trim()}>
                        {saving ? <CircularProgress size={18} /> : "Guardar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default function MantenedorPlantillas() {
    const { isEditor } = useAuth()
    const [tab, setTab] = useState(0)
    const [plantillas, setPlantillas] = useState([])
    const [loadingInicial, setLoadingInicial] = useState(true)
    const [error, setError] = useState(null)

    async function cargar() {
        // No poner loading en refrescos: desmontaría TabPlantilla y perdería la selección
        setError(null)
        try {
            setPlantillas(await getPlantillas())
        } catch {
            setError("Error al cargar plantillas de checklist")
        } finally {
            setLoadingInicial(false)
        }
    }

    useEffect(() => { cargar() }, [])

    const proposito = tab === 0 ? "Preparacion" : "Reasignacion"

    return (
        <Box>
            <Typography variant="h6" fontWeight={700} mb={1}>
                Plantillas de preparación
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
                Puede tener varias plantillas por propósito. Al preparar o reasignar un equipo, el técnico elige cuál usar.
                Las no vigentes quedan archivadas y no aparecen en el selector.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {loadingInicial ? (
                <CircularProgress size={28} />
            ) : (
                <>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                        <Tab label="Preparación" />
                        <Tab label="Reasignación" />
                    </Tabs>
                    <TabPlantilla
                        key={proposito}
                        proposito={proposito}
                        plantillas={plantillas}
                        onRefresh={cargar}
                        isEditor={isEditor}
                    />
                </>
            )}
        </Box>
    )
}
