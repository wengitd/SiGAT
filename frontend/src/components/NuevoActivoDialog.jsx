import { useState, useEffect, useCallback, useMemo } from "react"
import axiosClient from "../api/axiosClient"

import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Stepper, Step, StepLabel, Button, Box, Typography,
    Card, CardActionArea, CardContent, TextField, FormControl,
    InputLabel, Select, MenuItem, InputAdornment, Checkbox, FormControlLabel,
    IconButton, Divider, Autocomplete, FormHelperText, Alert,
} from "@mui/material"

import ComputerIcon from "@mui/icons-material/Computer"
import DevicesOtherIcon from "@mui/icons-material/DevicesOther"
import CloseIcon from "@mui/icons-material/Close"
import UploadFileIcon from "@mui/icons-material/UploadFile"

import AsignacionForm from "./AsignacionForm"
import CreatableAutocomplete from "./CreatableAutocomplete"
import { crearAsignacion } from "../services/asignacionService"
import { uploadFactura } from "../services/facturaService"
import { useDialog } from "../context/DialogContext"

function hoy() {
    return new Date().toISOString().slice(0, 10)
}

const PASOS = ["Tipo de activo", "Datos generales", "Estado", "Datos técnicos", "Resumen"]

const RAM_CAPACIDADES = [2, 4, 6, 8, 10, 12, 16, 20]
const RAM_TIPOS = ["DDR3", "DDR4", "DDR5"]
const U_MEDIDA_PRESETS = ["pulgadas", "VA", "ppm", "kg", "W"]

const FORM_INICIAL = {
    tipo: "",
    id_modelo: "", num_serie: "", origen: "", fecha_recep: "",
    id_tipoe: "", id_dispo: "",
    cpu: "", ram_capac: 8, ram_tipo: "",
    disco_tipo: "", disco_unidad: "", disco_capac: "",
    host_name: "", mac_ethernet: "", mac_wifi: "",
    id_tipoeq: "", id_edicion_so: "",
    valor_tec: "", u_medida: "", obs_perif: "", id_tipoper: "",
}

const FACTURA_INICIAL = {
    fecha_em: "",
    file: null,
}

// Normaliza a formato XX:XX:XX:XX:XX:XX (6 pares hexadecimales, máx. 17 caracteres)
function formatMac(valor) {
    const hex = valor.replace(/[^0-9a-fA-F]/g, "").toUpperCase().slice(0, 12)
    return hex.match(/.{1,2}/g)?.join(":") ?? ""
}

function macIncompleta(valor) {
    if (!valor) return false
    return valor.replace(/:/g, "").length > 0 && valor.replace(/:/g, "").length < 12
}

const TIPOS = [
    { valor: "equipo_computo", label: "Computacional", icon: <ComputerIcon sx={{ fontSize: 48 }} /> },
    { valor: "periferico", label: "Periférico", icon: <DevicesOtherIcon sx={{ fontSize: 48 }} /> },
]

function limpiarError(setErrores, campo) {
    setErrores(prev => {
        if (!prev[campo]) return prev
        const next = { ...prev }
        delete next[campo]
        return next
    })
}

function PasoTipo({ form, setForm, setAsignarAhora }) {
    return (
        <Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
                ¿Qué tipo de activo deseas registrar?
            </Typography>

            <Box sx={{ display: "flex", gap: 3 }}>
                {TIPOS.map(t => (
                    <Card
                        key={t.valor}
                        variant="outlined"
                        sx={{
                            flex: 1,
                            border: form.tipo === t.valor ? "2px solid" : "1px solid",
                            borderColor: form.tipo === t.valor ? "primary.main" : "divider",
                            bgcolor: form.tipo === t.valor ? "primary.50" : "background.paper",
                        }}
                    >
                        <CardActionArea
                            onClick={() => {
                                if (t.valor !== form.tipo) {
                                    setForm({ ...form, tipo: t.valor, id_modelo: "" })
                                }
                                if (t.valor === "equipo_computo") setAsignarAhora(false)
                            }}
                            sx={{ p: 3, textAlign: "center" }}
                        >
                            <CardContent>
                                {t.icon}
                                <Typography variant="h6" sx={{ mt: 1 }}>{t.label}</Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                ))}
            </Box>
        </Box>
    )
}

function PasoGenerales({
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

    // Sólo se ofrecen marcas del mismo tipo de activo (Computacional / Periférico)
    const marcasDelTipo = marcas.filter(m => m.tipo_activo === form.tipo)

    const marcaSeleccionada = marcasDelTipo.find(m => m.id_marca === selMarca) ?? null
    const modelosDeMarca = modelos.filter(m => m.id_marca === selMarca)
    const modeloSeleccionado = modelosDeMarca.find(m => m.id_modelo === form.id_modelo) ?? null

    async function crearMarca(nombre) {
        const { data } = await axiosClient.post("/marcas/ensure", { nombre, tipo_activo: form.tipo })
        setMarcas(prev => (prev.some(m => m.id_marca === data.id_marca) ? prev : [...prev, data]))
        setSelMarca(data.id_marca)
        setForm(prev => ({ ...prev, id_modelo: "" }))
        limpiarError(setErrores, "id_modelo")
        return data
    }

    async function crearModelo(nombre) {
        if (!selMarca) return null
        const { data } = await axiosClient.post("/modelos/ensure", { nombre, id_marca: selMarca })
        setModelos(prev => (prev.some(m => m.id_modelo === data.id_modelo) ? prev : [...prev, data]))
        setForm(prev => ({ ...prev, id_modelo: data.id_modelo }))
        limpiarError(setErrores, "id_modelo")
        return data
    }

    return (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <CreatableAutocomplete
                label="Marca"
                options={marcasDelTipo}
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
                    <MenuItem value="empresa">Empresa</MenuItem>
                    <MenuItem value="personal">Personal</MenuItem>
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

function PasoEstado({ form, setForm, tiposEstado, errores, setErrores }) {
    const [dispoPermitidas, setDispoPermitidas] = useState([])

    useEffect(() => {
        if (!form.id_tipoe) { setDispoPermitidas([]); return }
        axiosClient.get(`/disponibilidades/por-estado/${form.id_tipoe}`)
            .then(r => setDispoPermitidas(r.data))
            .catch(() => setDispoPermitidas([]))
    }, [form.id_tipoe])

    const condicionSeleccionada = tiposEstado.find(t => t.id_tipoe === form.id_tipoe) ?? null
    const dispoSeleccionada = dispoPermitidas.find(d => d.id_dispo === form.id_dispo) ?? null

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Autocomplete
                fullWidth
                options={tiposEstado}
                value={condicionSeleccionada}
                getOptionLabel={(t) => t.nombre ?? ""}
                isOptionEqualToValue={(a, b) => a.id_tipoe === b.id_tipoe}
                onChange={(_, opt) => {
                    setForm(prev => ({ ...prev, id_tipoe: opt?.id_tipoe ?? "", id_dispo: "" }))
                    limpiarError(setErrores, "id_tipoe")
                    limpiarError(setErrores, "id_dispo")
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Condición del equipo"
                        required
                        error={!!errores.id_tipoe}
                        helperText={errores.id_tipoe}
                    />
                )}
            />

            <Autocomplete
                fullWidth
                disabled={!form.id_tipoe}
                options={dispoPermitidas}
                value={dispoSeleccionada}
                getOptionLabel={(d) => d.nombre ?? ""}
                isOptionEqualToValue={(a, b) => a.id_dispo === b.id_dispo}
                onChange={(_, opt) => {
                    setForm(prev => ({ ...prev, id_dispo: opt?.id_dispo ?? "" }))
                    limpiarError(setErrores, "id_dispo")
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Disponibilidad"
                        required
                        error={!!errores.id_dispo}
                        helperText={errores.id_dispo}
                    />
                )}
            />
        </Box>
    )
}

function PasoTecnico({
    form, setForm, tiposEquipo, setTiposEquipo, tiposPerif, setTiposPerif,
    sugerenciasCpu, sugerenciasUMedida, errores, setErrores,
}) {
    const [familias, setFamilias] = useState([])
    const [versiones, setVersiones] = useState([])
    const [ediciones, setEdiciones] = useState([])
    const [selFam, setSelFam] = useState("")
    const [selVer, setSelVer] = useState("")

    useEffect(() => {
        axiosClient.get("/sistemas-operativos/familias").then(r => setFamilias(r.data))
    }, [])

    useEffect(() => {
        if (!selFam) { setVersiones([]); setEdiciones([]); setSelVer(""); setForm(p => ({ ...p, id_edicion_so: "" })); return }
        axiosClient.get(`/sistemas-operativos/versiones/por-familia/${selFam}`)
            .then(r => { setVersiones(r.data); setEdiciones([]); setSelVer(""); setForm(p => ({ ...p, id_edicion_so: "" })) })
    }, [selFam])

    useEffect(() => {
        if (!selVer) { setEdiciones([]); setForm(p => ({ ...p, id_edicion_so: "" })); return }
        axiosClient.get(`/sistemas-operativos/ediciones/por-version/${selVer}`)
            .then(r => { setEdiciones(r.data); setForm(p => ({ ...p, id_edicion_so: "" })) })
    }, [selVer])

    function handle(e) {
        limpiarError(setErrores, e.target.name)
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    function handleMac(e) {
        limpiarError(setErrores, e.target.name)
        setForm({ ...form, [e.target.name]: formatMac(e.target.value) })
    }

    const tipoEquipoSel = tiposEquipo.find(t => t.id_tipoeq === form.id_tipoeq) ?? null
    const tipoPerifSel = tiposPerif.find(t => t.id_tipoper === form.id_tipoper) ?? null
    const familiaSel = familias.find(f => f.id_fam_so === selFam) ?? null
    const versionSel = versiones.find(v => v.id_ver_so === selVer) ?? null
    const edicionSel = ediciones.find(e => e.id_edicion_so === form.id_edicion_so) ?? null

    const opcionesUMedida = useMemo(() => {
        const set = new Set([...U_MEDIDA_PRESETS, ...sugerenciasUMedida])
        return [...set].sort((a, b) => a.localeCompare(b, "es"))
    }, [sugerenciasUMedida])

    async function crearTipoEquipo(nombre) {
        const { data } = await axiosClient.post("/tipos-equipo/ensure", { nombre })
        setTiposEquipo(prev => (prev.some(t => t.id_tipoeq === data.id_tipoeq) ? prev : [...prev, data]))
        setForm(prev => ({ ...prev, id_tipoeq: data.id_tipoeq }))
        return data
    }

    async function crearTipoPerif(nombre) {
        const { data } = await axiosClient.post("/tipos-periferico/ensure", { nombre })
        setTiposPerif(prev => (prev.some(t => t.id_tipoper === data.id_tipoper) ? prev : [...prev, data]))
        setForm(prev => ({ ...prev, id_tipoper: data.id_tipoper }))
        return data
    }

    if (form.tipo === "equipo_computo") return (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <CreatableAutocomplete
                label="Tipo equipo"
                options={tiposEquipo}
                value={tipoEquipoSel}
                getOptionLabel={(t) => t.nombre ?? ""}
                isOptionEqualToValue={(a, b) => a.id_tipoeq === b.id_tipoeq}
                onChange={(opt) => setForm(prev => ({ ...prev, id_tipoeq: opt?.id_tipoeq ?? "" }))}
                onCreate={crearTipoEquipo}
            />

            <Autocomplete
                freeSolo
                options={sugerenciasCpu}
                inputValue={form.cpu}
                onInputChange={(_, v) => setForm(prev => ({ ...prev, cpu: v }))}
                renderInput={(params) => <TextField {...params} label="CPU" />}
            />

            <TextField label="Host name" name="host_name" value={form.host_name} onChange={handle} />

            <FormControl>
                <InputLabel>RAM (capacidad)</InputLabel>
                <Select name="ram_capac" label="RAM (capacidad)" value={form.ram_capac} onChange={handle}>
                    {RAM_CAPACIDADES.map(r => <MenuItem key={r} value={r}>{r} GB</MenuItem>)}
                </Select>
            </FormControl>

            <FormControl>
                <InputLabel>RAM (tipo)</InputLabel>
                <Select name="ram_tipo" label="RAM (tipo)" value={form.ram_tipo} onChange={handle}>
                    {RAM_TIPOS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
            </FormControl>

            <FormControl>
                <InputLabel>Tipo de disco</InputLabel>
                <Select name="disco_tipo" label="Tipo de disco" value={form.disco_tipo} onChange={handle}>
                    {["HDD", "SSD", "NVMe", "eMMC"].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
            </FormControl>

            <TextField label="Capacidad disco" name="disco_capac" value={form.disco_capac} onChange={handle} type="number"
                slotProps={{ input: { endAdornment: <InputAdornment position="end"></InputAdornment> } }} />

            <FormControl>
                <InputLabel>Unidad disco</InputLabel>
                <Select name="disco_unidad" label="Unidad disco" value={form.disco_unidad} onChange={handle}>
                    {["MB", "GB", "TB"].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
            </FormControl>

            <TextField
                label="MAC Ethernet"
                name="mac_ethernet"
                value={form.mac_ethernet}
                onChange={handleMac}
                placeholder="30:D1:6B:9F:04:AB"
                error={!!errores.mac_ethernet}
                helperText={errores.mac_ethernet}
                slotProps={{ htmlInput: { maxLength: 17 } }}
            />
            <TextField
                label="MAC Wifi"
                name="mac_wifi"
                value={form.mac_wifi}
                onChange={handleMac}
                placeholder="30:D1:6B:9F:04:AB"
                error={!!errores.mac_wifi}
                helperText={errores.mac_wifi}
                slotProps={{ htmlInput: { maxLength: 17 } }}
            />

            <Autocomplete
                options={familias}
                value={familiaSel}
                getOptionLabel={(f) => f.nombre ?? ""}
                isOptionEqualToValue={(a, b) => a.id_fam_so === b.id_fam_so}
                onChange={(_, opt) => setSelFam(opt?.id_fam_so ?? "")}
                renderInput={(params) => <TextField {...params} label="Familia SO" />}
            />

            <Autocomplete
                disabled={!selFam}
                options={versiones}
                value={versionSel}
                getOptionLabel={(v) => v.nombre ?? ""}
                isOptionEqualToValue={(a, b) => a.id_ver_so === b.id_ver_so}
                onChange={(_, opt) => setSelVer(opt?.id_ver_so ?? "")}
                renderInput={(params) => <TextField {...params} label="Versión" />}
            />

            <Autocomplete
                sx={{ gridColumn: "span 2" }}
                disabled={!selVer}
                options={ediciones}
                value={edicionSel}
                getOptionLabel={(e) => e.nombre ?? ""}
                isOptionEqualToValue={(a, b) => a.id_edicion_so === b.id_edicion_so}
                onChange={(_, opt) => setForm(prev => ({ ...prev, id_edicion_so: opt?.id_edicion_so ?? "" }))}
                renderInput={(params) => <TextField {...params} label="Edición" />}
            />
        </Box>
    )

    if (form.tipo === "periferico") return (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <CreatableAutocomplete
                label="Tipo de periférico"
                options={tiposPerif}
                value={tipoPerifSel}
                sx={{ gridColumn: "span 2" }}
                getOptionLabel={(t) => t.nombre ?? ""}
                isOptionEqualToValue={(a, b) => a.id_tipoper === b.id_tipoper}
                onChange={(opt) => setForm(prev => ({ ...prev, id_tipoper: opt?.id_tipoper ?? "" }))}
                onCreate={crearTipoPerif}
            />

            <TextField label="Valor técnico" name="valor_tec" value={form.valor_tec} onChange={handle} type="number" />

            <Autocomplete
                freeSolo
                options={opcionesUMedida}
                inputValue={form.u_medida}
                onInputChange={(_, v) => setForm(prev => ({ ...prev, u_medida: v }))}
                renderInput={(params) => <TextField {...params} label="Unidad medida" />}
            />

            <TextField label="Observaciones" name="obs_perif" value={form.obs_perif} onChange={handle}
                multiline rows={3} sx={{ gridColumn: "span 2" }} />
        </Box>
    )

    return null
}

function FilaResumen({ label, valor }) {
    return (
        <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ fontWeight: 600, minWidth: 170 }}>{label}:</Typography>
            <Typography color="text.secondary">{valor || "—"}</Typography>
        </Box>
    )
}

function SeccionResumen({ titulo, filas }) {
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1, textTransform: "uppercase", letterSpacing: 1 }}>
                {titulo}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, pl: 1 }}>
                {filas.map(([label, valor]) => (
                    <FilaResumen key={label} label={label} valor={valor} />
                ))}
            </Box>
        </Box>
    )
}

function PasoResumen({ form, tiposEstado, tiposDispo, tiposEquipo, tiposPerif, factura, marcas, modelos, familiasSO, versionesSO, edicionesSO,
    asignarAhora, setAsignarAhora, asignacion, setAsignacion, empleadosOpciones, errores, setErrores }) {
    const nombreEstado = tiposEstado.find(t => t.id_tipoe === form.id_tipoe)?.nombre
    const nombreDispo = tiposDispo.find(d => d.id_dispo === form.id_dispo)?.nombre
    const nombreFactura = factura.file
        ? `${factura.fecha_em || "Sin fecha"} — ${factura.file.name}`
        : null

    const modeloSel = modelos.find(m => m.id_modelo === form.id_modelo)
    const marcaSel = marcas.find(m => m.id_marca === modeloSel?.id_marca)

    const edicion = edicionesSO.find(e => e.id_edicion_so === form.id_edicion_so)
    const version = versionesSO.find(v => v.id_ver_so === edicion?.id_ver_so)
    const familia = familiasSO.find(f => f.id_fam_so === version?.id_fam_so)
    const nombreSO = edicion ? `${familia?.nombre ?? ""} ${version?.nombre ?? ""} ${edicion.nombre}`.trim() : null

    const seccionGeneral = [
        ["Tipo", form.tipo === "equipo_computo" ? "Computacional" : "Periférico"],
        ["Marca", marcaSel?.nombre],
        ["Modelo", modeloSel?.nombre],
        ["Número de serie", form.num_serie],
        ["Fecha recepción", form.fecha_recep],
        ["Origen", form.origen],
        ["Factura", nombreFactura],
    ]

    const seccionEstado = [
        ["Condición", nombreEstado],
        ["Disponibilidad", nombreDispo],
    ]

    const seccionComputacional = [
        ["Tipo de equipo", tiposEquipo.find(t => t.id_tipoeq === form.id_tipoeq)?.nombre],
        ["Sistema operativo", nombreSO],
        ["CPU", form.cpu],
        ["RAM (capacidad)", form.ram_capac ? `${form.ram_capac} GB` : null],
        ["RAM (tipo)", form.ram_tipo],
        ["Disco (tipo)", form.disco_tipo],
        ["Disco (capacidad)", form.disco_capac ? `${form.disco_capac} ${form.disco_unidad || ""}`.trim() : null],
        ["Host name", form.host_name],
        ["MAC Ethernet", form.mac_ethernet],
        ["MAC Wi-Fi", form.mac_wifi],
    ]

    const seccionPeriferico = [
        ["Tipo de periférico", tiposPerif.find(t => t.id_tipoper === form.id_tipoper)?.nombre],
        ["Valor técnico", form.valor_tec ? `${form.valor_tec} ${form.u_medida || ""}`.trim() : null],
        ["Observaciones", form.obs_perif],
    ]

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Resumen del activo</Typography>
            <SeccionResumen titulo="Datos generales" filas={seccionGeneral} />
            <SeccionResumen titulo="Estado" filas={seccionEstado} />
            {form.tipo === "equipo_computo"
                ? <SeccionResumen titulo="Datos técnicos — Computacional" filas={seccionComputacional} />
                : <SeccionResumen titulo="Datos técnicos — Periférico" filas={seccionPeriferico} />
            }

            {form.tipo === "equipo_computo" ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Los equipos computacionales deben completar el checklist de preparación en Inventario antes de asignarse.
                </Alert>
            ) : (
                <>
                    <FormControlLabel
                        sx={{ mt: 2 }}
                        control={<Checkbox checked={asignarAhora} onChange={(e) => {
                            setAsignarAhora(e.target.checked)
                            if (!e.target.checked) {
                                limpiarError(setErrores, "id_emp")
                                limpiarError(setErrores, "fecha_entr")
                            }
                        }} />}
                        label="Asignar este activo a un empleado ahora"
                    />
                    {asignarAhora &&
                        <AsignacionForm
                            value={asignacion}
                            onChange={(v) => {
                                setAsignacion(v)
                                if (v.id_emp) limpiarError(setErrores, "id_emp")
                                if (v.fecha_entr) limpiarError(setErrores, "fecha_entr")
                            }}
                            empleadosOpciones={empleadosOpciones}
                            ocultarActivo
                            errores={errores}
                        />
                    }
                </>
            )}
        </Box>
    )
}

/**
 * Dialog con flujo por pasos para registrar un nuevo activo.
 * Props: open, onClose, onCreado (callback tras guardar exitoso).
 */
export default function NuevoActivoDialog({ open, onClose, onCreado }) {
    const { alert: showAlert } = useDialog()
    const [paso, setPaso] = useState(0)
    const [guardando, setGuardando] = useState(false)
    const [errores, setErrores] = useState({})

    const [factura, setFactura] = useState({ ...FACTURA_INICIAL })
    const [facturaPreviewUrl, setFacturaPreviewUrl] = useState(null)
    const [marcas, setMarcas] = useState([])
    const [modelos, setModelos] = useState([])
    const [tiposEstado, setTiposEstado] = useState([])
    const [tiposDispo, setTiposDispo] = useState([])
    const [tiposEquipo, setTiposEquipo] = useState([])
    const [tiposPerif, setTiposPerif] = useState([])
    const [familiasSO, setFamiliasSO] = useState([])
    const [versionesSO, setVersionesSO] = useState([])
    const [edicionesSO, setEdicionesSO] = useState([])
    const [empleadosOpciones, setEmpleadosOpciones] = useState([])
    const [sugerenciasCpu, setSugerenciasCpu] = useState([])
    const [sugerenciasUMedida, setSugerenciasUMedida] = useState([])
    const [asignarAhora, setAsignarAhora] = useState(false)
    const [asignacion, setAsignacion] = useState({ id_emp: "", fecha_entr: hoy(), ruta_acta_entr: "" })
    const [form, setForm] = useState({ ...FORM_INICIAL })

    const limpiarPreviewFactura = useCallback(() => {
        setFacturaPreviewUrl(prev => {
            if (prev) URL.revokeObjectURL(prev)
            return null
        })
    }, [])

    const resetFormulario = useCallback(() => {
        setPaso(0)
        setForm({ ...FORM_INICIAL })
        setFactura({ ...FACTURA_INICIAL })
        limpiarPreviewFactura()
        setAsignarAhora(false)
        setAsignacion({ id_emp: "", fecha_entr: hoy(), ruta_acta_entr: "" })
        setGuardando(false)
        setErrores({})
    }, [limpiarPreviewFactura])

    function onFacturaFileChange(e) {
        const file = e.target.files?.[0] ?? null
        e.target.value = ""
        limpiarError(setErrores, "file")
        if (!file) {
            setFactura(prev => ({ ...prev, file: null }))
            limpiarPreviewFactura()
            return
        }
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            setErrores(prev => ({ ...prev, file: "Solo se permiten archivos PDF" }))
            setFactura(prev => ({ ...prev, file: null }))
            limpiarPreviewFactura()
            return
        }
        setFactura(prev => ({ ...prev, file }))
        limpiarPreviewFactura()
        setFacturaPreviewUrl(URL.createObjectURL(file))
    }

    useEffect(() => {
        if (!open) return
        axiosClient.get("/marcas/").then(r => setMarcas(r.data))
        axiosClient.get("/modelos/").then(r => setModelos(r.data))
        axiosClient.get("/tipos-estado/").then(r => setTiposEstado(r.data))
        axiosClient.get("/disponibilidades/").then(r => setTiposDispo(r.data))
        axiosClient.get("/tipos-equipo/").then(r => setTiposEquipo(r.data))
        axiosClient.get("/tipos-periferico/").then(r => setTiposPerif(r.data))
        axiosClient.get("/sistemas-operativos/familias").then(r => setFamiliasSO(r.data))
        axiosClient.get("/sistemas-operativos/versiones").then(r => setVersionesSO(r.data))
        axiosClient.get("/sistemas-operativos/ediciones").then(r => setEdicionesSO(r.data))
        axiosClient.get("/empleado/").then(r => setEmpleadosOpciones(r.data.filter(e => e.operatividad)))
        axiosClient.get("/ActivoTi/sugerencias/cpu").then(r => setSugerenciasCpu(r.data)).catch(() => setSugerenciasCpu([]))
        axiosClient.get("/ActivoTi/sugerencias/u-medida").then(r => setSugerenciasUMedida(r.data)).catch(() => setSugerenciasUMedida([]))
    }, [open])

    useEffect(() => () => {
        if (facturaPreviewUrl) URL.revokeObjectURL(facturaPreviewUrl)
    }, [facturaPreviewUrl])

    function handleClose() {
        if (guardando) return
        resetFormulario()
        onClose?.()
    }

    function validarPaso(n) {
        const nuevos = {}
        if (n === 1) {
            if (!form.origen) nuevos.origen = "El origen es obligatorio"

            const facturaParcial = Boolean(factura.fecha_em || factura.file)
            if (facturaParcial) {
                if (!factura.fecha_em) nuevos.fecha_em = "La fecha de emisión es obligatoria"
                if (!factura.file) nuevos.file = "Adjunta el PDF de la factura"
            }
        }
        if (n === 2) {
            if (!form.id_tipoe) nuevos.id_tipoe = "Selecciona la condición"
            if (!form.id_dispo) nuevos.id_dispo = "Selecciona la disponibilidad"
        }
        if (n === 3 && form.tipo === "equipo_computo") {
            if (macIncompleta(form.mac_ethernet)) {
                nuevos.mac_ethernet = "MAC incompleta (formato XX:XX:XX:XX:XX:XX)"
            }
            if (macIncompleta(form.mac_wifi)) {
                nuevos.mac_wifi = "MAC incompleta (formato XX:XX:XX:XX:XX:XX)"
            }
        }
        setErrores(nuevos)
        return Object.keys(nuevos).length === 0
    }

    function validarAsignacion() {
        if (!asignarAhora) return true
        const nuevos = {}
        if (!asignacion.id_emp) nuevos.id_emp = "Selecciona el empleado"
        if (!asignacion.fecha_entr) nuevos.fecha_entr = "La fecha de entrega es obligatoria"
        setErrores(nuevos)
        return Object.keys(nuevos).length === 0
    }

    async function enviar() {
        if (!validarAsignacion()) return
        if (!validarPaso(1)) {
            setPaso(1)
            return
        }

        const payload = Object.fromEntries(
            Object.entries(form).filter(([_, v]) => v !== "" && v !== null)
        )
        setGuardando(true)
        try {
            const { data: nuevoActivo } = await axiosClient.post("/ActivoTi/", payload)

            if (factura.file) {
                try {
                    await uploadFactura({
                        id_act: nuevoActivo.id_act,
                        fecha_em: factura.fecha_em,
                        file: factura.file,
                    })
                } catch (factErr) {
                    const detail = factErr.response?.data?.detail
                    const mensaje = typeof detail === "string"
                        ? detail
                        : "El activo se creó, pero no se pudo guardar la factura"
                    await showAlert({
                        title: "Error al subir factura",
                        message: mensaje,
                        severity: "warning",
                    })
                    resetFormulario()
                    onCreado?.()
                    onClose?.()
                    return
                }
            }

            // Computacionales requieren checklist de preparación antes de asignar
            if (asignarAhora && form.tipo !== "equipo_computo") {
                await crearAsignacion({
                    id_act: nuevoActivo.id_act,
                    id_emp: asignacion.id_emp,
                    fecha_entr: asignacion.fecha_entr,
                    ruta_acta_entr: asignacion.ruta_acta_entr || null,
                })
            }
            resetFormulario()
            onCreado?.()
            onClose?.()
        } catch (err) {
            console.log(err.response?.data)
            const detail = err.response?.data?.detail
            const mensaje = typeof detail === "string" ? detail : "Error al guardar el activo"
            if (typeof detail === "string" && detail.toLowerCase().includes("número de serie")) {
                setErrores({ num_serie: detail })
                setPaso(1)
            } else {
                await showAlert({
                    title: "Error de guardado",
                    message: mensaje,
                    severity: "error",
                })
            }
        } finally {
            setGuardando(false)
        }
    }

    async function siguiente() {
        if (!validarPaso(paso)) return

        // Valida unicidad de serie al salir de Datos generales
        if (paso === 1 && form.num_serie?.trim()) {
            try {
                const { data } = await axiosClient.get("/ActivoTi/existe-serie", {
                    params: { num_serie: form.num_serie.trim() },
                })
                if (data.existe) {
                    setErrores({
                        num_serie: "Ya existe un activo con ese número de serie",
                    })
                    return
                }
            } catch {
                // Si falla la consulta, no bloquea el avance; el POST lo validará
            }
        }

        setErrores({})
        setPaso(p => p + 1)
    }

    function anterior() {
        setErrores({})
        setPaso(p => p - 1)
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            scroll="paper"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 1,
                        maxHeight: "90vh",
                    },
                },
            }}
        >
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1, pb: 1 }}>
                <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
                    Agregar Activo
                </Typography>
                <IconButton onClick={handleClose} size="small" disabled={guardando} aria-label="Cerrar">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                <Stepper activeStep={paso} alternativeLabel sx={{ mb: 4 }}>
                    {PASOS.map(label => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box>
                    {paso === 0 && <PasoTipo form={form} setForm={setForm} setAsignarAhora={setAsignarAhora} />}
                    {paso === 1 && (
                        <PasoGenerales
                            form={form}
                            setForm={setForm}
                            factura={factura}
                            setFactura={setFactura}
                            facturaPreviewUrl={facturaPreviewUrl}
                            onFacturaFileChange={onFacturaFileChange}
                            marcas={marcas}
                            setMarcas={setMarcas}
                            modelos={modelos}
                            setModelos={setModelos}
                            errores={errores}
                            setErrores={setErrores}
                        />
                    )}
                    {paso === 2 && (
                        <PasoEstado
                            form={form}
                            setForm={setForm}
                            tiposEstado={tiposEstado}
                            errores={errores}
                            setErrores={setErrores}
                        />
                    )}
                    {paso === 3 && (
                        <PasoTecnico
                            form={form}
                            setForm={setForm}
                            tiposEquipo={tiposEquipo}
                            setTiposEquipo={setTiposEquipo}
                            tiposPerif={tiposPerif}
                            setTiposPerif={setTiposPerif}
                            sugerenciasCpu={sugerenciasCpu}
                            sugerenciasUMedida={sugerenciasUMedida}
                            errores={errores}
                            setErrores={setErrores}
                        />
                    )}
                    {paso === 4 && (
                        <PasoResumen
                            form={form}
                            tiposEstado={tiposEstado}
                            tiposDispo={tiposDispo}
                            tiposEquipo={tiposEquipo}
                            tiposPerif={tiposPerif}
                            factura={factura}
                            marcas={marcas}
                            modelos={modelos}
                            familiasSO={familiasSO}
                            versionesSO={versionesSO}
                            edicionesSO={edicionesSO}
                            asignarAhora={asignarAhora}
                            setAsignarAhora={setAsignarAhora}
                            asignacion={asignacion}
                            setAsignacion={setAsignacion}
                            empleadosOpciones={empleadosOpciones}
                            errores={errores}
                            setErrores={setErrores}
                        />
                    )}
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
                <Button onClick={anterior} disabled={paso === 0 || guardando}>Atrás</Button>
                {paso < PASOS.length - 1
                    ? <Button variant="contained" onClick={siguiente} disabled={paso === 0 && form.tipo === ""}>Siguiente</Button>
                    : <Button variant="contained" color="success" onClick={enviar} disabled={guardando}>
                        {guardando ? "Guardando…" : "Confirmar"}
                    </Button>
                }
            </DialogActions>
        </Dialog>
    )
}
