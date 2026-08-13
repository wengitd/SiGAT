import { useState, useEffect, useCallback } from "react";
import {
    Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, TextField, MenuItem, Typography, CircularProgress,
    Alert, Tooltip, Chip, FormControl, InputLabel, Select,
} from "@mui/material";

const COLOR_OPCIONES = [
    { value: "success", label: "Verde" },
    { value: "primary", label: "Verde Oscuro" },
    { value: "warning", label: "Naranja" },
    { value: "info", label: "Celeste" },
    { value: "error", label: "Rojo" },
    { value: "default", label: "Gris" },
];
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
    listCatalog,
    createCatalog,
    updateCatalog,
    deleteCatalog,
} from "../api";
import { useAuth } from "../../../core/auth/AuthContext";
import { useDialog } from "../../../core/dialog/DialogContext";

/*
  MantenedorCatalogo — componente genérico de CRUD para catálogos simples.

  Props:
    title        : string          — título del catálogo (ej. "Empresas")
    endpoint     : string          — prefijo API (ej. "/empresas")
    idField      : string          — nombre del campo PK (ej. "id_org")
    fields       : FieldDef[]      — definición de columnas/formulario
    parentFilter?: { param, label, endpoint, idField, labelField }
                                   — para catálogos dependientes (sub_area, etc.)

  FieldDef:
    { name, label, required?, type?: "text"|"select",
      options?: [{value, label}],           // select estático
      optionsEndpoint?: string,             // select dinámico (fetched)
      optionsIdField?: string,              // id del option
      optionsLabelField?: string }          // label del option
*/
export default function MantenedorCatalogo({ title, endpoint, idField, fields }) {
    const { isEditor } = useAuth();
    const { confirm } = useDialog();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Dialog
    const [open, setOpen] = useState(false);
    const [editRow, setEditRow] = useState(null);   // null = nuevo
    const [editId, setEditId] = useState(null);   // ID explícito del registro a editar
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    // Confirm delete
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Options for select fields (fetched dynamically)
    const [selectOptions, setSelectOptions] = useState({});

    // ── Fetch rows ────────────────────────────────────────────
    const fetchRows = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listCatalog(endpoint);
            setRows(data);
        } catch {
            setError("Error al cargar los datos.");
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    useEffect(() => { fetchRows(); }, [fetchRows]);

    // ── Fetch select options ──────────────────────────────────
    useEffect(() => {
        fields.forEach(async (f) => {
            if (f.type === "select" && f.optionsEndpoint) {
                try {
                    const data = await listCatalog(f.optionsEndpoint);
                    setSelectOptions((prev) => ({ ...prev, [f.name]: data }));
                } catch {
                    // silencioso: el select queda vacío
                }
            }
        });
    }, [fields]);

    // ── Open dialog ───────────────────────────────────────────
    function isFieldEmpty(val) {
        if (val === null || val === undefined || val === "") return true;
        if (typeof val === "string" && !val.trim()) return true;
        return false;
    }

    function setFieldValue(name, value) {
        setForm((p) => ({ ...p, [name]: value }));
        setFieldErrors((prev) => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
    }

    function openCreate() {
        const empty = {};
        fields.forEach((f) => { empty[f.name] = ""; });
        setForm(empty);
        setEditRow(null);
        setEditId(null);
        setFormError(null);
        setFieldErrors({});
        setOpen(true);
    }

    function openEdit(params) {
        const prefill = {};
        fields.forEach((f) => { prefill[f.name] = params.row[f.name] ?? ""; });
        setForm(prefill);
        setEditRow(params.row);
        setEditId(params.id);     // params.id viene de getRowId — siempre correcto en DataGrid v9
        setFormError(null);
        setFieldErrors({});
        setOpen(true);
    }

    // ── Save ──────────────────────────────────────────────────
    async function handleSave() {
        setFormError(null);

        const errores = {};
        fields.forEach((f) => {
            if (f.required && isFieldEmpty(form[f.name])) {
                errores[f.name] = "Campo obligatorio";
            }
        });
        if (Object.keys(errores).length > 0) {
            setFieldErrors(errores);
            return;
        }
        setFieldErrors({});

        setSaving(true);
        try {
            // Cast integer fields
            const payload = {};
            fields.forEach((f) => {
                payload[f.name] = (f.type === "select" && f.optionsEndpoint)
                    ? (form[f.name] === "" ? null : Number(form[f.name]))
                    : (typeof form[f.name] === "string" ? form[f.name].trim() : form[f.name]);
            });

            if (editId !== null) {
                await updateCatalog(endpoint, editId, payload);
            } else {
                await createCatalog(endpoint, payload);
            }
            setOpen(false);
            fetchRows();
        } catch (err) {
            setFormError(err.response?.data?.detail ?? "Error al guardar.");
        } finally {
            setSaving(false);
        }
    }

    // ── Delete ────────────────────────────────────────────────
    async function promptDelete(id) {
        const ok = await confirm({
            title: "Confirmar eliminación",
            message: `¿Seguro que deseas eliminar este registro de ${title}?`,
            severity: "error",
            confirmText: "Eliminar",
        });
        if (!ok) return;

        try {
            await deleteCatalog(endpoint, id);
            fetchRows();
        } catch (err) {
            setError(err.response?.data?.detail ?? "Error al eliminar.");
        }
    }

    // ── Columns ───────────────────────────────────────────────
    const dataColumns = fields.map((f) => ({
        field: f.name,
        headerName: f.label,
        flex: 1,
        minWidth: 120,
        valueGetter: (value, row) => {
            if (f.type === "select" && f.optionsEndpoint) {
                const opts = selectOptions[f.name] ?? [];
                const match = opts.find((o) => o[f.optionsIdField] === row[f.name]);
                return match ? match[f.optionsLabelField] : value;
            }
            return value;
        },
        ...(f.type === "colorselect" ? {
            renderCell: (params) => params.value
                ? <Chip
                    label={COLOR_OPCIONES.find(o => o.value === params.value)?.label ?? params.value}
                    color={params.value}
                    size="small"
                />
                : "—",
        } : {}),
    }));

    const columns = [
        ...dataColumns,
        {
            field: "__actions",
            headerName: "",
            width: 90,
            sortable: false,
            renderCell: (params) => isEditor ? (
                <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openEdit(params)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => promptDelete(params.id)}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ) : null,
        },
    ];

    // ── Render ────────────────────────────────────────────────
    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>{title}</Typography>
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
                getRowId={(row) => row[idField]}
                loading={loading}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                disableRowSelectionOnClick
                sx={{ bgcolor: "background.paper", borderRadius: 1 }}
            />

            {/* ── Dialog Crear / Editar ──────────────────────────── */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{editRow ? `Editar ${title}` : `Nuevo ${title}`}</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
                    {formError && <Alert severity="error">{formError}</Alert>}

                    {fields.map((f) => {
                        const hasError = Boolean(fieldErrors[f.name]);
                        const helper = fieldErrors[f.name] ?? "";

                        if (f.type === "colorselect") {
                            return (
                                <FormControl key={f.name} size="small" required={f.required} error={hasError}>
                                    <InputLabel>{f.label}</InputLabel>
                                    <Select
                                        label={f.label}
                                        value={form[f.name] ?? ""}
                                        onChange={(e) => setFieldValue(f.name, e.target.value)}
                                    >
                                        {COLOR_OPCIONES.map((o) => (
                                            <MenuItem key={o.value} value={o.value}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Chip label={o.label} color={o.value} size="small" />
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {hasError && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                            {helper}
                                        </Typography>
                                    )}
                                </FormControl>
                            );
                        }

                        if (f.type === "select") {
                            const opts = f.options
                                ? f.options
                                : (selectOptions[f.name] ?? []).map((o) => ({
                                    value: o[f.optionsIdField],
                                    label: o[f.optionsLabelField],
                                }));

                            return (
                                <TextField
                                    key={f.name}
                                    select
                                    label={f.label}
                                    value={form[f.name] ?? ""}
                                    onChange={(e) => setFieldValue(f.name, e.target.value)}
                                    required={f.required}
                                    error={hasError}
                                    helperText={helper}
                                    size="small"
                                >
                                    {opts.map((o) => (
                                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                    ))}
                                </TextField>
                            );
                        }

                        return (
                            <TextField
                                key={f.name}
                                label={f.label}
                                value={form[f.name] ?? ""}
                                onChange={(e) => setFieldValue(f.name, e.target.value)}
                                required={f.required}
                                error={hasError}
                                helperText={helper}
                                size="small"
                                slotProps={{ htmlInput: { maxLength: 100 } }}
                            />
                        );
                    })}
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
