import { useState, useEffect, useCallback } from "react";
import {
    Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, TextField, MenuItem, Typography, CircularProgress,
    Alert, Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";
import { useDialog } from "../../context/DialogContext";

export default function MantenedorEstadoDispo() {
    const { isEditor } = useAuth();
    const { confirm } = useDialog();

    const [rows, setRows] = useState([]);
    const [tiposEstado, setTiposEstado] = useState([]);
    const [disponibilidades, setDisponibilidades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ id_tipoe: "", id_dispo: "" });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [relRes, estRes, disRes] = await Promise.all([
                axiosClient.get("/disponibilidades/relaciones"),
                axiosClient.get("/tipos-estado/"),
                axiosClient.get("/disponibilidades/"),
            ]);
            setTiposEstado(estRes.data);
            setDisponibilidades(disRes.data);
            setRows(relRes.data.map((r) => ({
                ...r,
                id: `${r.id_tipoe}-${r.id_dispo}`,
            })));
        } catch {
            setError("Error al cargar las relaciones.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    function nombreEstado(id) {
        return tiposEstado.find((t) => t.id_tipoe === id)?.nombre ?? id;
    }

    function nombreDispo(id) {
        return disponibilidades.find((d) => d.id_dispo === id)?.nombre ?? id;
    }

    function openCreate() {
        setForm({ id_tipoe: "", id_dispo: "" });
        setFormError(null);
        setOpen(true);
    }

    async function handleSave() {
        if (!form.id_tipoe || !form.id_dispo) {
            setFormError("Debes seleccionar condición y disponibilidad.");
            return;
        }
        setFormError(null);
        setSaving(true);
        try {
            await axiosClient.post("/disponibilidades/relaciones", {
                id_tipoe: Number(form.id_tipoe),
                id_dispo: Number(form.id_dispo),
            });
            setOpen(false);
            fetchData();
        } catch (err) {
            setFormError(err.response?.data?.detail ?? "Error al guardar.");
        } finally {
            setSaving(false);
        }
    }

    async function promptDelete(row) {
        const estNombre = nombreEstado(row.id_tipoe);
        const disNombre = nombreDispo(row.id_dispo);
        const ok = await confirm({
            title: "Confirmar eliminación",
            message: `¿Eliminar la relación "${estNombre} → ${disNombre}"?`,
            severity: "error",
            confirmText: "Eliminar",
        });
        if (!ok) return;

        try {
            await axiosClient.delete(
                `/disponibilidades/relaciones/${row.id_tipoe}/${row.id_dispo}`
            );
            fetchData();
        } catch (err) {
            setError(err.response?.data?.detail ?? "Error al eliminar.");
        }
    }

    const columns = [
        {
            field: "condicion",
            headerName: "Condición del equipo",
            flex: 1,
            minWidth: 180,
            valueGetter: (_, row) => nombreEstado(row.id_tipoe),
        },
        {
            field: "disponibilidad",
            headerName: "Disponibilidad permitida",
            flex: 1,
            minWidth: 180,
            valueGetter: (_, row) => nombreDispo(row.id_dispo),
        },
        {
            field: "__actions",
            headerName: "",
            width: 70,
            sortable: false,
            renderCell: (params) => isEditor ? (
                <Tooltip title="Eliminar">
                    <IconButton size="small" color="error" onClick={() => promptDelete(params.row)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            ) : null,
        },
    ];

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Estado ↔ Disponibilidad
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Define qué opciones de disponibilidad se muestran según la condición del equipo.
                    </Typography>
                </Box>
                {isEditor && (
                    <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={openCreate}>
                        Agregar
                    </Button>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row.id}
                loading={loading}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                disableRowSelectionOnClick
                sx={{ bgcolor: "background.paper", borderRadius: 1 }}
            />

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Nueva relación</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
                    {formError && <Alert severity="error">{formError}</Alert>}

                    <TextField
                        select
                        label="Condición del equipo"
                        value={form.id_tipoe}
                        onChange={(e) => setForm((p) => ({ ...p, id_tipoe: e.target.value }))}
                        required
                        size="small"
                    >
                        {tiposEstado.map((t) => (
                            <MenuItem key={t.id_tipoe} value={t.id_tipoe}>{t.nombre}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Disponibilidad"
                        value={form.id_dispo}
                        onChange={(e) => setForm((p) => ({ ...p, id_dispo: e.target.value }))}
                        required
                        size="small"
                    >
                        {disponibilidades.map((d) => (
                            <MenuItem key={d.id_dispo} value={d.id_dispo}>{d.nombre}</MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" disabled={saving}>
                        {saving ? <CircularProgress size={18} /> : "Guardar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
