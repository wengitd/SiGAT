import { useState } from "react"
import {
  Box, TextField, FormControl, InputLabel, Select, MenuItem,
  FormHelperText, Button, Typography,
} from "@mui/material"
import UploadFileIcon from "@mui/icons-material/UploadFile"
import CreatableAutocomplete from "../../../../shared/ui/CreatableAutocomplete"
import { ensureMarca, ensureModelo } from "../../../catalogos/api"
import { limpiarError, hoy } from "./constants"

export function PasoGenerales({
    form, setForm, factura, setFactura, facturaPreviewUrl, onFacturaFileChange,
    marcas, setMarcas, modelos, setModelos, errores, setErrores,
}) {
    function handle(e) {
        limpiarError(setErrores, e.target.name)
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    function handleFactura(e) {
        const { name, value } = e.target
        limpiarError(setErrores, name)
        setFactura(prev => ({ ...prev, [name]: value }))
    }

    // Cascada Marca → Modelo. selMarca es solo un filtro local;
    // lo que se envía al backend es form.id_modelo.
    const [selMarca, setSelMarca] = useState(() => {
        const modeloActual = modelos.find(m => m.id_modelo === form.id_modelo)
        return modeloActual?.id_marca ?? ""
    })

    const marcaSeleccionada = marcas.find(m => m.id_marca === selMarca) ?? null
    const modelosDeMarca = modelos.filter(m => m.id_marca === selMarca)
    const modeloSeleccionado = modelosDeMarca.find(m => m.id_modelo === form.id_modelo) ?? null

    async function crearMarca(nombre) {
        const data = await ensureMarca(nombre)
        setMarcas(prev => (prev.some(m => m.id_marca === data.id_marca) ? prev : [...prev, data]))
        setSelMarca(data.id_marca)
        setForm(prev => ({ ...prev, id_modelo: "" }))
        limpiarError(setErrores, "id_modelo")
        return data
    }

    async function crearModelo(nombre) {
        if (!selMarca) return null
        const data = await ensureModelo(nombre, selMarca)
        setModelos(prev => (prev.some(m => m.id_modelo === data.id_modelo) ? prev : [...prev, data]))
        setForm(prev => ({ ...prev, id_modelo: data.id_modelo }))
        limpiarError(setErrores, "id_modelo")
        return data
    }

    return (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <CreatableAutocomplete
                label="Marca"
                options={marcas}
                value={marcaSeleccionada}
                getOptionLabel={(m) => m.nombre ?? ""}
                isOptionEqualToValue={(a, b) => a.id_marca === b.id_marca}
                onChange={(opt) => {
                    setSelMarca(opt?.id_marca ?? "")
                    setForm(prev => ({ ...prev, id_modelo: "" }))
                    limpiarError(setErrores, "id_modelo")
                }}
                onCreate={crearMarca}
            />

            <CreatableAutocomplete
                label="Modelo"
                options={modelosDeMarca}
                value={modeloSeleccionado}
                disabled={!selMarca}
                getOptionLabel={(m) => m.nombre ?? ""}
                isOptionEqualToValue={(a, b) => a.id_modelo === b.id_modelo}
                onChange={(opt) => {
                    setForm(prev => ({ ...prev, id_modelo: opt?.id_modelo ?? "" }))
                    limpiarError(setErrores, "id_modelo")
                }}
                onCreate={crearModelo}
            />

            <TextField
                label="Número serie"
                name="num_serie"
                value={form.num_serie}
                onChange={handle}
                error={!!errores.num_serie}
                helperText={errores.num_serie}
            />
            <TextField label="Fecha recepción" name="fecha_recep" value={form.fecha_recep}
                onChange={handle} type="date"
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoy() } }} />

            <FormControl fullWidth error={!!errores.origen} required sx={{ gridColumn: "span 2" }}>
                <InputLabel>Origen</InputLabel>
                <Select
                    name="origen"
                    label="Origen"
                    value={form.origen}
                    onChange={handle}
                >
                    <MenuItem value="Empresa">Empresa</MenuItem>
                    <MenuItem value="Personal">Personal</MenuItem>
                </Select>
                {errores.origen && <FormHelperText>{errores.origen}</FormHelperText>}
            </FormControl>

            <Typography variant="subtitle2" color="text.secondary" sx={{ gridColumn: "span 2", mt: 1 }}>
                Factura
            </Typography>

            <TextField
                label="Fecha emisión"
                name="fecha_em"
                type="date"
                value={factura.fecha_em}
                onChange={handleFactura}
                error={!!errores.fecha_em}
                helperText={errores.fecha_em}
                sx={{ gridColumn: "span 2" }}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoy() } }}
            />

            <Box sx={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Button
                    component="label"
                    variant="outlined"
                    startIcon={<UploadFileIcon />}
                    sx={{ alignSelf: "flex-start" }}
                >
                    {factura.file ? factura.file.name : "Adjuntar PDF de factura"}
                    <input
                        type="file"
                        hidden
                        accept="application/pdf,.pdf"
                        onChange={onFacturaFileChange}
                    />
                </Button>
                {errores.file && (
                    <FormHelperText error>{errores.file}</FormHelperText>
                )}
                {facturaPreviewUrl && (
                    <Box
                        sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                            overflow: "hidden",
                            bgcolor: "grey.100",
                        }}
                    >
                        <Box
                            component="iframe"
                            title="Vista previa factura"
                            src={facturaPreviewUrl}
                            sx={{
                                width: "100%",
                                height: 300,
                                border: 0,
                                display: "block",
                                bgcolor: "background.paper",
                            }}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    )
}

