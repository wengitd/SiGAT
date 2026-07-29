import { useState, useEffect  } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axiosClient from "../../api/axiosClient"

import { Stepper, Step, StepLabel, Button, Box, Typography,
    Card, CardActionArea, CardContent, TextField, FormControl,
    InputLabel, Select, MenuItem, InputAdornment, Checkbox, FormControlLabel} from "@mui/material"

import ComputerIcon     from "@mui/icons-material/Computer"
import DevicesOtherIcon from "@mui/icons-material/DevicesOther"

import AsignacionForm from "../../components/AsignacionForm"
import { crearAsignacion } from "../../services/asignacionService"

function hoy() {
    return new Date().toISOString().slice(0, 10)
}

//Stepper
const PASOS = ["Tipo de activo", "Datos generales", "Estado", "Datos técnicos", "Resumen"]

const RAM_CAPACIDADES = [2, 4, 6, 8, 10, 12, 16, 20]
const RAM_TIPOS = ["DDR3", "DDR4", "DDR5"]

// Normaliza a formato XX:XX:XX:XX:XX:XX (6 pares hexadecimales, máx. 17 caracteres)
function formatMac(valor) {
    const hex = valor.replace(/[^0-9a-fA-F]/g, "").toUpperCase().slice(0, 12)
    return hex.match(/.{1,2}/g)?.join(":") ?? ""
}

//Opciones de el tipo de activo
const TIPOS = [
    { valor: "equipo_computo", label: "Computacional", icon: <ComputerIcon sx={{ fontSize: 48 }} /> },
    { valor: "periferico",     label: "Periférico",    icon: <DevicesOtherIcon sx={{ fontSize: 48 }} /> },
]



function PasoTipo({ form, setForm }) {
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
                            onClick={() => setForm({ ...form, tipo: t.valor })}
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

function PasoGenerales({ form, setForm, facturas, marcas, modelos }) {
    function handle(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    // Cascada Marca → Modelo. selMarca es solo un filtro local para el
    // dropdown de modelos; lo que se envía al backend es form.id_modelo.
    // Se inicializa a partir del id_modelo ya elegido (si el usuario vuelve
    // a este paso desde el resumen) para no perder la selección de marca.
    const [selMarca, setSelMarca] = useState(() => {
        const modeloActual = modelos.find(m => m.id_modelo === form.id_modelo)
        return modeloActual?.id_marca ?? ""
    })

    const modelosDeMarca = modelos.filter(m => m.id_marca === selMarca)

    function handleMarca(e) {
        setSelMarca(e.target.value)
        setForm({ ...form, id_modelo: "" })
    }

    return (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl>
                <InputLabel>Marca</InputLabel>
                <Select label="Marca" value={selMarca} onChange={handleMarca}>
                    {marcas.length === 0 && <MenuItem value=""><em>Sin especificar</em></MenuItem>}
                    {marcas.map(m => <MenuItem key={m.id_marca} value={m.id_marca}>{m.nombre}</MenuItem>)}
                </Select>
            </FormControl>

            <FormControl disabled={!selMarca}>
                <InputLabel>Modelo</InputLabel>
                <Select name="id_modelo" label="Modelo" value={form.id_modelo} onChange={handle}>
                    {modelosDeMarca.length === 0 && <MenuItem value=""><em>Sin especificar</em></MenuItem>}
                    {modelosDeMarca.map(m => <MenuItem key={m.id_modelo} value={m.id_modelo}>{m.nombre}</MenuItem>)}
                </Select>
            </FormControl>

            <TextField label="Número serie"  name="num_serie" value={form.num_serie} onChange={handle} />
            <TextField label="Fecha recepción" name="fecha_recep" value={form.fecha_recep}
                onChange={handle} type="date"
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoy() } }} />

            <FormControl>
                <InputLabel>Origen</InputLabel>
                <Select name="origen" label="Origen" value={form.origen} onChange={handle}>
                    <MenuItem value="empresa">Empresa</MenuItem>
                    <MenuItem value="personal">Personal</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth sx={{ gridColumn: "span 2" }}>
                <InputLabel>Factura</InputLabel>
                <Select name="id_fact" label="Factura" value={form.id_fact} onChange={handle}>
                    <MenuItem value=""><em>Sin factura</em></MenuItem>
                    {facturas.map(f => (
                        <MenuItem key={f.id_fact} value={f.id_fact}>
                            Folio # {f.num_folio}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    )
}

//------------------------------------------------------------------
//-----------------PASO 3 ESTADO------------------------------------
////////////////////////////////////////////////////////////////////
function PasoEstado({ form, setForm, tiposEstado }) {
    const [dispoPermitidas, setDispoPermitidas] = useState([])

    useEffect(() => {
        if (!form.id_tipoe) { setDispoPermitidas([]); return }
        axiosClient.get(`/disponibilidades/por-estado/${form.id_tipoe}`)
            .then(r => setDispoPermitidas(r.data))
            .catch(() => setDispoPermitidas([]))
    }, [form.id_tipoe])

    function handle(e) {
        if (e.target.name === "id_tipoe") {
            setForm({ ...form, id_tipoe: e.target.value, id_dispo: "" })
            return
        }
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

            {/*Dropdown estado del equipo */}
            <FormControl fullWidth>
                <InputLabel>Condición del equipo</InputLabel>
                <Select name="id_tipoe" label="Condición del equipo" value={form.id_tipoe} onChange={handle}>
                    {tiposEstado.map(t => (
                        <MenuItem key={t.id_tipoe} value={t.id_tipoe}>{t.nombre}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            
            {/*Dropdown de disponibilidad */}
            <FormControl fullWidth disabled={!form.id_tipoe}>
                <InputLabel>Disponibilidad</InputLabel>
                <Select name="id_dispo" label="Disponibilidad" value={form.id_dispo} onChange={handle}>
                    {dispoPermitidas.map(d => (
                        <MenuItem key={d.id_dispo} value={d.id_dispo}>{d.nombre}</MenuItem>
                    ))}
                </Select>
            </FormControl>

        </Box>
    )
}

//------------------------------------------------------------------
//-----------------PASO 4 DATOS TECNICOS------------------------------------
////////////////////////////////////////////////////////////////////

function PasoTecnico({ form, setForm, tiposEquipo, tiposPerif }) {
    // Cascada SO
    const [familias,  setFamilias]  = useState([])
    const [versiones, setVersiones] = useState([])
    const [ediciones, setEdiciones] = useState([])
    const [selFam,    setSelFam]    = useState("")
    const [selVer,    setSelVer]    = useState("")

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
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    function handleMac(e) {
        setForm({ ...form, [e.target.name]: formatMac(e.target.value) })
    }

    if (form.tipo === "equipo_computo") return (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>

            <FormControl>
                <InputLabel>Tipo equipo</InputLabel>
                <Select name="id_tipoeq" label="Tipo equipo" value={form.id_tipoeq} onChange={handle}>
                    {tiposEquipo.length === 0 && <MenuItem value=""><em>Sin especificar</em></MenuItem>}
                    {tiposEquipo.map(t => <MenuItem key={t.id_tipoeq} value={t.id_tipoeq}>{t.nombre}</MenuItem>)}
                </Select>
            </FormControl>

            <TextField label="CPU"        name="cpu"       value={form.cpu}       onChange={handle} />
            <TextField label="Host name"  name="host_name" value={form.host_name} onChange={handle} />

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
                    {["HDD","SSD","NVMe","eMMC"].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
            </FormControl>

            <TextField label="Capacidad disco" name="disco_capac" value={form.disco_capac} onChange={handle} type="number" 
                slotProps={{ input: { endAdornment: <InputAdornment position="end"></InputAdornment> } }}/>

            <FormControl>
                <InputLabel>Unidad disco</InputLabel>
                <Select name="disco_unidad" label="Unidad disco" value={form.disco_unidad} onChange={handle}>
                    {["MB","GB","TB"].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
            </FormControl>

            <TextField label="MAC Ethernet" name="mac_ethernet" value={form.mac_ethernet} onChange={handleMac}
                placeholder="30:D1:6B:9F:04:AB" slotProps={{ htmlInput: { maxLength: 17 } }} />
            <TextField label="MAC Wifi"     name="mac_wifi"     value={form.mac_wifi}     onChange={handleMac}
                placeholder="30:D1:6B:9F:04:AB" slotProps={{ htmlInput: { maxLength: 17 } }} />
            

            
            {/* SO en cascada */}
            <FormControl>
                <InputLabel>Familia SO</InputLabel>
                <Select label="Familia SO" value={selFam} onChange={e => setSelFam(e.target.value)}>
                    {familias.length === 0 && <MenuItem value=""><em>Sin especificar</em></MenuItem>}
                    {familias.map(f => <MenuItem key={f.id_fam_so} value={f.id_fam_so}>{f.nombre}</MenuItem>)}
                </Select>
            </FormControl>

            <FormControl disabled={!selFam}>
                <InputLabel>Versión</InputLabel>
                <Select label="Versión" value={selVer} onChange={e => setSelVer(e.target.value)}>
                    {versiones.length === 0 && <MenuItem value=""><em>Sin especificar</em></MenuItem>}
                    {versiones.map(v => <MenuItem key={v.id_ver_so} value={v.id_ver_so}>{v.nombre}</MenuItem>)}
                </Select>
            </FormControl>

            <FormControl sx={{ gridColumn: "span 2" }} disabled={!selVer}>
                <InputLabel>Edición</InputLabel>
                <Select name="id_edicion_so" label="Edición" value={form.id_edicion_so} onChange={handle}>
                    {ediciones.length === 0 && <MenuItem value=""><em>Sin especificar</em></MenuItem>}
                    {ediciones.map(e => <MenuItem key={e.id_edicion_so} value={e.id_edicion_so}>{e.nombre}</MenuItem>)}
                </Select>
            </FormControl>

        </Box>
    )

    if (form.tipo === "periferico") return (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>

            <FormControl sx={{ gridColumn: "span 2" }}>
                <InputLabel>Tipo de periférico</InputLabel>
                <Select name="id_tipoper" label="Tipo de periférico" value={form.id_tipoper} onChange={handle}>
                    {tiposPerif.length === 0 && <MenuItem value=""><em>Sin especificar</em></MenuItem>}
                    {tiposPerif.map(t => <MenuItem key={t.id_tipoper} value={t.id_tipoper}>{t.nombre}</MenuItem>)}
                </Select>
            </FormControl>

            <TextField label="Valor técnico" name="valor_tec" value={form.valor_tec} onChange={handle} type="number" />
            <TextField label="Unidad medida" name="u_medida"  value={form.u_medida}  onChange={handle} />
            <TextField label="Observaciones" name="obs_perif" value={form.obs_perif} onChange={handle} 
                multiline rows={3} sx={{ gridColumn: "span 2" }} />

        </Box>
    )
}


//------------------------------------------------------------------
//-----------------PASO 5 RESUMEN-----------------------------------
////////////////////////////////////////////////////////////////////

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

function PasoResumen({ form, tiposEstado, tiposDispo, tiposEquipo, tiposPerif, facturas, marcas, modelos, familiasSO, versionesSO, edicionesSO,
    asignarAhora, setAsignarAhora, asignacion, setAsignacion, empleadosOpciones }) {
    const nombreEstado  = tiposEstado.find(t => t.id_tipoe  === form.id_tipoe)?.nombre
    const nombreDispo   = tiposDispo .find(d => d.id_dispo  === form.id_dispo )?.nombre
    const nombreFactura = facturas   .find(f => f.id_fact   === form.id_fact  )
        ? `Folio #${facturas.find(f => f.id_fact === form.id_fact).num_folio}` : null

    // Resuelve marca/modelo desde el id_modelo elegido
    const modeloSel = modelos.find(m => m.id_modelo === form.id_modelo)
    const marcaSel  = marcas.find(m => m.id_marca === modeloSel?.id_marca)

    // Resuelve el SO desde los 3 niveles
    const edicion = edicionesSO.find(e => e.id_edicion_so === form.id_edicion_so)
    const version = versionesSO.find(v => v.id_ver_so     === edicion?.id_ver_so)
    const familia = familiasSO .find(f => f.id_fam_so     === version?.id_fam_so)
    const nombreSO = edicion ? `${familia?.nombre ?? ""} ${version?.nombre ?? ""} ${edicion.nombre}`.trim() : null

    const seccionGeneral = [
        ["Tipo",             form.tipo === "equipo_computo" ? "Computacional" : "Periférico"],
        ["Marca",            marcaSel?.nombre],
        ["Modelo",           modeloSel?.nombre],
        ["Número de serie",  form.num_serie],
        ["Fecha recepción",  form.fecha_recep],
        ["Origen",           form.origen],
        ["Factura",          nombreFactura],
    ]

    const seccionEstado = [
        ["Condición",        nombreEstado],
        ["Disponibilidad",   nombreDispo],
    ]

    const seccionComputacional = [
        ["Tipo de equipo",   tiposEquipo.find(t => t.id_tipoeq === form.id_tipoeq)?.nombre],
        ["Sistema operativo", nombreSO],
        ["CPU",              form.cpu],
        ["RAM (capacidad)",  form.ram_capac ? `${form.ram_capac} GB` : null],
        ["RAM (tipo)",       form.ram_tipo],
        ["Disco (tipo)",     form.disco_tipo],
        ["Disco (capacidad)",form.disco_capac ? `${form.disco_capac} ${form.disco_unidad || ""}`.trim() : null],
        ["Host name",        form.host_name],
        ["MAC Ethernet",     form.mac_ethernet],
        ["MAC Wi-Fi",        form.mac_wifi],
    ]

    const seccionPeriferico = [
        ["Tipo de periférico",tiposPerif.find(t => t.id_tipoper === form.id_tipoper)?.nombre],
        ["Valor técnico",    form.valor_tec ? `${form.valor_tec} ${form.u_medida || ""}`.trim() : null],
        ["Observaciones",    form.obs_perif],
    ]

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Resumen del activo</Typography>
            <SeccionResumen titulo="Datos generales" filas={seccionGeneral} />
            <SeccionResumen titulo="Estado"          filas={seccionEstado} />
            {form.tipo === "equipo_computo"
                ? <SeccionResumen titulo="Datos técnicos — Computacional" filas={seccionComputacional} />
                : <SeccionResumen titulo="Datos técnicos — Periférico"    filas={seccionPeriferico} />
            }

            <FormControlLabel
                sx={{ mt: 2 }}
                control={<Checkbox checked={asignarAhora} onChange={(e) => setAsignarAhora(e.target.checked)} />}
                label="Asignar este activo a un empleado ahora"
            />
            {asignarAhora &&
                <AsignacionForm
                    value={asignacion}
                    onChange={setAsignacion}
                    empleadosOpciones={empleadosOpciones}
                    ocultarActivo
                />
            }
        </Box>
    )
}



export default function NuevoActivoPage() {
    const navigate  = useNavigate()
    const location  = useLocation()
    const paginaOrigen = location.state?.paginaOrigen ?? "/activos/computacionales"
    const [paso, setPaso]   = useState(0)

    //Paso 2 - Datos generales
    const [facturas, setFacturas] = useState([])
    const [marcas,   setMarcas]   = useState([])
    const [modelos,  setModelos]  = useState([])

    //Paso 3 -  Tipo estado y disponibilidad
    const [tiposEstado, setTiposEstado] = useState([])
    const [tiposDispo,  setTiposDispo]  = useState([])

    //Paso 4 - Datos técnicos
    const [tiposEquipo,  setTiposEquipo]  = useState([])
    const [tiposPerif,   setTiposPerif]   = useState([])

    // SO en cascada — solo para el resumen
    const [familiasSO,   setFamiliasSO]   = useState([])
    const [versionesSO,  setVersionesSO]  = useState([])
    const [edicionesSO,  setEdicionesSO]  = useState([])

    // Paso 5 - Asignación opcional a un empleado
    const [empleadosOpciones, setEmpleadosOpciones] = useState([])
    const [asignarAhora, setAsignarAhora] = useState(false)
    const [asignacion, setAsignacion] = useState({ id_emp: "", fecha_entr: hoy(), ruta_acta_entr: "" })

    useEffect(() => {
        axiosClient.get("/factura/").then(r => setFacturas(r.data))
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
    }, [])


    async function enviar() {
        if (asignarAhora && (!asignacion.id_emp || !asignacion.fecha_entr)) {
            alert("Selecciona el empleado y la fecha de entrega para la asignación")
            return
        }
        const payload = Object.fromEntries(
            Object.entries(form).filter(([_, v]) => v !== "" && v !== null)
        )
        try {
            const { data: nuevoActivo } = await axiosClient.post("/ActivoTi/", payload)
            if (asignarAhora) {
                await crearAsignacion({
                    id_act: nuevoActivo.id_act,
                    id_emp: asignacion.id_emp,
                    fecha_entr: asignacion.fecha_entr,
                    ruta_acta_entr: asignacion.ruta_acta_entr || null,
                })
            }
            navigate(paginaOrigen)
        } catch (err) {
            console.log(err.response?.data)
            alert("Error al guardar el activo")
        }
    }


    const [form, setForm]   = useState({
        tipo: "",
        // generales
        id_modelo: "", num_serie: "", origen: "", id_fact: "", fecha_recep: "",
        // estado
        id_tipoe: "", id_dispo: "",
        // equipo_computo
        cpu: "", ram_capac: 8, ram_tipo: "",
        disco_tipo: "", disco_unidad: "", disco_capac: "",
        host_name: "", mac_ethernet: "", mac_wifi: "",
        id_tipoeq: "", id_edicion_so: "",
        // periferico
        valor_tec: "", u_medida: "", obs_perif: "", id_tipoper: ""
    })

    function siguiente() { 
        if (paso === 1 && !form.origen) {
            alert("El origen es obligatorio")
            return
        }
        if (paso === 2 && (!form.id_tipoe || !form.id_dispo)) {
            alert("Debes seleccionar la condición y la disponibilidad")
            return
        }
        setPaso(p => p + 1)
    }


    function anterior()  { setPaso(p => p - 1) }

    return (
        <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Agregar Activo</Typography>

            <Stepper activeStep={paso} sx={{ mb: 4 }}>
                {PASOS.map(label => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Box>
                {paso === 0 && <PasoTipo        form={form} setForm={setForm} />}
                {paso === 1 && <PasoGenerales   form={form} setForm={setForm} facturas={facturas} marcas={marcas} modelos={modelos} />}
                {paso === 2 && <PasoEstado      form={form} setForm={setForm} tiposEstado={tiposEstado} />}              
                {paso === 3 && <PasoTecnico form={form} setForm={setForm}
                    tiposEquipo={tiposEquipo} tiposPerif={tiposPerif} />}              
                
                {paso === 4 && <PasoResumen   form={form}
                    tiposEstado={tiposEstado} tiposDispo={tiposDispo}
                    tiposEquipo={tiposEquipo} tiposPerif={tiposPerif}
                    facturas={facturas} marcas={marcas} modelos={modelos}
                    familiasSO={familiasSO} versionesSO={versionesSO} edicionesSO={edicionesSO}
                    asignarAhora={asignarAhora} setAsignarAhora={setAsignarAhora}
                    asignacion={asignacion} setAsignacion={setAsignacion}
                    empleadosOpciones={empleadosOpciones} />}
            </Box>

            {/* Navegación */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                <Button onClick={anterior} disabled={paso === 0}>Atrás</Button>
                {paso < PASOS.length - 1
                    ? <Button variant="contained" onClick={siguiente}  disabled={paso === 0 && form.tipo === ""}>Siguiente</Button>
                    : <Button variant="contained" color="success" onClick={enviar}>Confirmar</Button>
                }
            </Box>
        </Box>
    )
}

