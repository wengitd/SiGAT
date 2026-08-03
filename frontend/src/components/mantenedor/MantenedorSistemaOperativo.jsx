import { useState, useEffect } from "react"
import {
    Box, Typography, Paper, Tabs, Tab,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem,
    IconButton, Tooltip, CircularProgress, Alert,
} from "@mui/material"
import { DataGrid } from "@mui/x-data-grid"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import axiosClient from "../../api/axiosClient"
import { useAuth } from "../../context/AuthContext"
import { useDialog } from "../../context/DialogContext"

// ── FAMILIA ──────────────────────────────────────────────────────────────────

function TabFamilias({ isEditor }) {
    const { confirm } = useDialog()
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [open, setOpen] = useState(false)
    const [editId, setEditId] = useState(null)
    const [nombre, setNombre] = useState("")
    const [saving, setSaving] = useState(false)

    async function cargar() {
        setLoading(true)
        try { setRows((await axiosClient.get("/sistemas-operativos/familias")).data) }
        catch { setError("Error al cargar familias") }
        finally { setLoading(false) }
    }
    useEffect(() => { cargar() }, [])

    function openCreate() { setEditId(null); setNombre(""); setOpen(true) }
    function openEdit(row) { setEditId(row.id_fam_so); setNombre(row.nombre); setOpen(true) }

    async function guardar() {
        setSaving(true)
        try {
            if (editId) await axiosClient.put(`/sistemas-operativos/familias/${editId}`, { nombre })
            else await axiosClient.post("/sistemas-operativos/familias", { nombre })
            setOpen(false); cargar()
        } catch (err) { setError(err.response?.data?.detail ?? "Error al guardar") }
        finally { setSaving(false) }
    }

    async function promptDelete(row) {
        const ok = await confirm({
            title: "Confirmar eliminación",
            message: `¿Seguro que deseas eliminar la familia "${row.nombre}"?`,
            severity: "error",
            confirmText: "Eliminar",
        })
        if (!ok) return
        try {
            await axiosClient.delete(`/sistemas-operativos/familias/${row.id_fam_so}`)
            cargar()
        } catch (err) {
            setError(err.response?.data?.detail ?? "Error al eliminar")
        }
    }

    const columns = [
        { field: "id_fam_so", headerName: "ID", width: 70 },
        { field: "nombre", headerName: "Familia", flex: 1 },
        {
            field: "__acc", headerName: "", width: 90, sortable: false,
            renderCell: (p) => isEditor ? (
                <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(p.row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => promptDelete(p.row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
            ) : null
        },
    ]

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {isEditor && <Button variant="contained" startIcon={<AddIcon />} size="small" sx={{ mb: 2 }} onClick={openCreate}>Agregar familia</Button>}
            <DataGrid rows={rows} columns={columns} getRowId={r => r.id_fam_so} loading={loading} autoHeight pageSizeOptions={[10]} disableRowSelectionOnClick />

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{editId ? "Editar familia" : "Nueva familia"}</DialogTitle>
                <DialogContent sx={{ pt: "16px !important" }}>
                    <TextField label="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} fullWidth size="small" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
                    <Button onClick={guardar} variant="contained" disabled={saving}>{saving ? <CircularProgress size={18} /> : "Guardar"}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

// ── VERSIONES ─────────────────────────────────────────────────────────────────

function TabVersiones({ isEditor }) {
    const { confirm } = useDialog()
    const [rows, setRows] = useState([])
    const [familias, setFamilias] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [open, setOpen] = useState(false)
    const [editId, setEditId] = useState(null)
    const [form, setForm] = useState({ nombre: "", id_fam_so: "" })
    const [saving, setSaving] = useState(false)

    async function cargar() {
        setLoading(true)
        try {
            const [vers, fams] = await Promise.all([
                axiosClient.get("/sistemas-operativos/versiones"),
                axiosClient.get("/sistemas-operativos/familias"),
            ])
            setRows(vers.data); setFamilias(fams.data)
        } catch { setError("Error al cargar versiones") }
        finally { setLoading(false) }
    }
    useEffect(() => { cargar() }, [])

    function openCreate() { setEditId(null); setForm({ nombre: "", id_fam_so: "" }); setOpen(true) }
    function openEdit(row) { setEditId(row.id_ver_so); setForm({ nombre: row.nombre, id_fam_so: row.id_fam_so }); setOpen(true) }

    async function guardar() {
        setSaving(true)
        try {
            const payload = { nombre: form.nombre, id_fam_so: Number(form.id_fam_so) }
            if (editId) await axiosClient.put(`/sistemas-operativos/versiones/${editId}`, payload)
            else await axiosClient.post("/sistemas-operativos/versiones", payload)
            setOpen(false); cargar()
        } catch (err) { setError(err.response?.data?.detail ?? "Error al guardar") }
        finally { setSaving(false) }
    }

    async function promptDelete(row) {
        const ok = await confirm({
            title: "Confirmar eliminación",
            message: `¿Seguro que deseas eliminar la versión "${row.nombre}"?`,
            severity: "error",
            confirmText: "Eliminar",
        })
        if (!ok) return
        try {
            await axiosClient.delete(`/sistemas-operativos/versiones/${row.id_ver_so}`)
            cargar()
        } catch (err) {
            setError(err.response?.data?.detail ?? "Error al eliminar")
        }
    }

    const columns = [
        { field: "id_ver_so", headerName: "ID", width: 70 },
        { field: "nombre", headerName: "Versión", flex: 1 },
        {
            field: "id_fam_so", headerName: "Familia", flex: 1,
            valueGetter: (value) => familias.find(f => f.id_fam_so === value)?.nombre ?? value
        },
        {
            field: "__acc", headerName: "", width: 90, sortable: false,
            renderCell: (p) => isEditor ? (
                <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(p.row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => promptDelete(p.row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
            ) : null
        },
    ]

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {isEditor && <Button variant="contained" startIcon={<AddIcon />} size="small" sx={{ mb: 2 }} onClick={openCreate}>Agregar versión</Button>}
            <DataGrid rows={rows} columns={columns} getRowId={r => r.id_ver_so} loading={loading} autoHeight pageSizeOptions={[10]} disableRowSelectionOnClick />

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{editId ? "Editar versión" : "Nueva versión"}</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
                    <FormControl size="small" required>
                        <InputLabel>Familia</InputLabel>
                        <Select label="Familia" value={form.id_fam_so} onChange={e => setForm(p => ({ ...p, id_fam_so: e.target.value }))}>
                            {familias.map(f => <MenuItem key={f.id_fam_so} value={f.id_fam_so}>{f.nombre}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField label="Versión" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} size="small" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
                    <Button onClick={guardar} variant="contained" disabled={saving}>{saving ? <CircularProgress size={18} /> : "Guardar"}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

// ── EDICIONES ─────────────────────────────────────────────────────────────────

function TabEdiciones({ isEditor }) {
    const { confirm } = useDialog()
    const [rows, setRows] = useState([])
    const [familias, setFamilias] = useState([])
    const [versiones, setVersiones] = useState([])
    const [versFilt, setVersFilt] = useState([])   // versiones filtradas por familia
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [open, setOpen] = useState(false)
    const [editId, setEditId] = useState(null)
    const [form, setForm] = useState({ nombre: "", id_fam_so: "", id_ver_so: "" })
    const [saving, setSaving] = useState(false)

    async function cargar() {
        setLoading(true)
        try {
            const [edics, fams, vers] = await Promise.all([
                axiosClient.get("/sistemas-operativos/ediciones"),
                axiosClient.get("/sistemas-operativos/familias"),
                axiosClient.get("/sistemas-operativos/versiones"),
            ])
            setRows(edics.data); setFamilias(fams.data); setVersiones(vers.data)
        } catch { setError("Error al cargar ediciones") }
        finally { setLoading(false) }
    }
    useEffect(() => { cargar() }, [])

    // Al cambiar familia en el form, filtra las versiones disponibles
    useEffect(() => {
        if (!form.id_fam_so) { setVersFilt([]); return }
        setVersFilt(versiones.filter(v => v.id_fam_so === Number(form.id_fam_so)))
        setForm(p => ({ ...p, id_ver_so: "" }))
    }, [form.id_fam_so, versiones])

    function openCreate() { setEditId(null); setForm({ nombre: "", id_fam_so: "", id_ver_so: "" }); setOpen(true) }
    function openEdit(row) {
        const ver = versiones.find(v => v.id_ver_so === row.id_ver_so)
        setEditId(row.id_edicion_so)
        setForm({ nombre: row.nombre, id_fam_so: ver?.id_fam_so ?? "", id_ver_so: row.id_ver_so })
        setOpen(true)
    }

    async function guardar() {
        setSaving(true)
        try {
            const payload = { nombre: form.nombre, id_ver_so: Number(form.id_ver_so) }
            if (editId) await axiosClient.put(`/sistemas-operativos/ediciones/${editId}`, payload)
            else await axiosClient.post("/sistemas-operativos/ediciones", payload)
            setOpen(false); cargar()
        } catch (err) { setError(err.response?.data?.detail ?? "Error al guardar") }
        finally { setSaving(false) }
    }

    async function promptDelete(row) {
        const ok = await confirm({
            title: "Confirmar eliminación",
            message: `¿Seguro que deseas eliminar la edición "${row.nombre}"?`,
            severity: "error",
            confirmText: "Eliminar",
        })
        if (!ok) return
        try {
            await axiosClient.delete(`/sistemas-operativos/ediciones/${row.id_edicion_so}`)
            cargar()
        } catch (err) {
            setError(err.response?.data?.detail ?? "Error al eliminar")
        }
    }

    const columns = [
        { field: "id_edicion_so", headerName: "ID", width: 70 },
        { field: "nombre", headerName: "Edición", flex: 1 },
        {
            field: "id_ver_so", headerName: "Versión", flex: 1,
            valueGetter: (value) => versiones.find(v => v.id_ver_so === value)?.nombre ?? value
        },
        {
            field: "familia", headerName: "Familia", flex: 1,
            valueGetter: (_, row) => {
                const ver = versiones.find(v => v.id_ver_so === row.id_ver_so)
                return familias.find(f => f.id_fam_so === ver?.id_fam_so)?.nombre ?? "—"
            }
        },
        {
            field: "__acc", headerName: "", width: 90, sortable: false,
            renderCell: (p) => isEditor ? (
                <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(p.row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => promptDelete(p.row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
            ) : null
        },
    ]

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {isEditor && <Button variant="contained" startIcon={<AddIcon />} size="small" sx={{ mb: 2 }} onClick={openCreate}>Agregar edición</Button>}
            <DataGrid rows={rows} columns={columns} getRowId={r => r.id_edicion_so} loading={loading} autoHeight pageSizeOptions={[10]} disableRowSelectionOnClick />

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{editId ? "Editar edición" : "Nueva edición"}</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
                    <FormControl size="small" required>
                        <InputLabel>Familia</InputLabel>
                        <Select label="Familia" value={form.id_fam_so} onChange={e => setForm(p => ({ ...p, id_fam_so: e.target.value }))}>
                            {familias.map(f => <MenuItem key={f.id_fam_so} value={f.id_fam_so}>{f.nombre}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" required disabled={!form.id_fam_so}>
                        <InputLabel>Versión</InputLabel>
                        <Select label="Versión" value={form.id_ver_so} onChange={e => setForm(p => ({ ...p, id_ver_so: e.target.value }))}>
                            {versFilt.map(v => <MenuItem key={v.id_ver_so} value={v.id_ver_so}>{v.nombre}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField label="Edición" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} size="small" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
                    <Button onClick={guardar} variant="contained" disabled={saving}>{saving ? <CircularProgress size={18} /> : "Guardar"}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

// ── COMPONENTE EMBEBIDO EN EL MANTENEDOR ────────────────────────────────────

export default function MantenedorSistemaOperativo() {
    const { isEditor } = useAuth()
    const [tab, setTab] = useState(0)

    return (
        <Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Sistemas Operativos
            </Typography>

            <Paper variant="outlined" sx={{ mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label="Familias" />
                    <Tab label="Versiones" />
                    <Tab label="Ediciones" />
                </Tabs>
            </Paper>

            {tab === 0 && <TabFamilias isEditor={isEditor} />}
            {tab === 1 && <TabVersiones isEditor={isEditor} />}
            {tab === 2 && <TabEdiciones isEditor={isEditor} />}
        </Box>
    )
}
