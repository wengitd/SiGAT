import { useEffect, useState, useMemo } from "react"
import {
  Box, TextField, FormControl, InputLabel, Select, MenuItem,
  Autocomplete, InputAdornment,
} from "@mui/material"
import CreatableAutocomplete from "../../../../shared/ui/CreatableAutocomplete"
import {
  ensureTipoEquipo, ensureTipoPeriferico, getFamiliasSO, getVersionesSO, getEdicionesSO,
} from "../../../catalogos/api"
import {
  formatMac, RAM_CAPACIDADES, RAM_TIPOS, U_MEDIDA_PRESETS, limpiarError,
} from "./constants"

export function PasoTecnico({
    form, setForm, tiposEquipo, setTiposEquipo, tiposPerif, setTiposPerif,
    sugerenciasCpu, sugerenciasUMedida, errores, setErrores,
}) {
    const [familias, setFamilias] = useState([])
    const [versiones, setVersiones] = useState([])
    const [ediciones, setEdiciones] = useState([])
    const [selFam, setSelFam] = useState("")
    const [selVer, setSelVer] = useState("")

    useEffect(() => {
        getFamiliasSO().then(setFamilias)
    }, [])

    useEffect(() => {
        if (!selFam) { setVersiones([]); setEdiciones([]); setSelVer(""); setForm(p => ({ ...p, id_edicion_so: "" })); return }
        getVersionesSO(selFam).then(data => { setVersiones(data); setEdiciones([]); setSelVer(""); setForm(p => ({ ...p, id_edicion_so: "" })) })
    }, [selFam])

    useEffect(() => {
        if (!selVer) { setEdiciones([]); setForm(p => ({ ...p, id_edicion_so: "" })); return }
        getEdicionesSO(selVer).then(data => { setEdiciones(data); setForm(p => ({ ...p, id_edicion_so: "" })) })
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
        const data = await ensureTipoEquipo(nombre)
        setTiposEquipo(prev => (prev.some(t => t.id_tipoeq === data.id_tipoeq) ? prev : [...prev, data]))
        setForm(prev => ({ ...prev, id_tipoeq: data.id_tipoeq }))
        return data
    }

    async function crearTipoPerif(nombre) {
        const data = await ensureTipoPeriferico(nombre)
        setTiposPerif(prev => (prev.some(t => t.id_tipoper === data.id_tipoper) ? prev : [...prev, data]))
        setForm(prev => ({ ...prev, id_tipoper: data.id_tipoper }))
        return data
    }

    if (form.tipo === "Equipo Computo") return (
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

    if (form.tipo === "Periferico") return (
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

