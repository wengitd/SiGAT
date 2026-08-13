import { useState, useEffect, useCallback } from "react"
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Stepper, Step, StepLabel, Button, Box, Typography,
    IconButton, Divider,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"

import { crearAsignacion, uploadActa } from "../../../asignaciones/api"
import { uploadFactura } from "../../../facturas/api"
import { useDialog } from "../../../../core/dialog/DialogContext"
import { PASOS, FORM_INICIAL, FACTURA_INICIAL, hoy, limpiarError, macIncompleta, esDispoAsignado, idDispoDisponible } from "./constants"
import {
  createActivo,
  existeSerie,
  sugerenciasCpu as fetchSugerenciasCpu,
  sugerenciasUMedida as fetchSugerenciasUMedida,
} from "../../api"
import {
  getMarcas, getModelos, getTiposEstado, getDisponibilidades,
  getTiposEquipo, getTiposPeriferico,
  getFamiliasSO, getVersionesSO, getEdicionesSO,
} from "../../../catalogos/api"
import { getEmpleadosOperativos } from "../../../empleados/api"
import { PasoTipo } from "./PasoTipo"
import { PasoGenerales } from "./PasoGenerales"
import { PasoEstado } from "./PasoEstado"
import { PasoTecnico } from "./PasoTecnico"
import { PasoResumen } from "./PasoResumen"

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
    const [asignacion, setAsignacion] = useState({ id_emp: "", fecha_entr: hoy(), actaFile: null })
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
        setAsignacion({ id_emp: "", fecha_entr: hoy(), actaFile: null })
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
        getMarcas().then(setMarcas)
        getModelos().then(setModelos)
        getTiposEstado().then(setTiposEstado)
        getDisponibilidades().then(setTiposDispo)
        getTiposEquipo().then(setTiposEquipo)
        getTiposPeriferico().then(setTiposPerif)
        getFamiliasSO().then(setFamiliasSO)
        getVersionesSO().then(setVersionesSO)
        getEdicionesSO().then(setEdicionesSO)
        getEmpleadosOperativos().then(setEmpleadosOpciones)
        fetchSugerenciasCpu().then(setSugerenciasCpu).catch(() => setSugerenciasCpu([]))
        fetchSugerenciasUMedida().then(setSugerenciasUMedida).catch(() => setSugerenciasUMedida([]))
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
        if (n === 0) {
            if (!form.tipo) nuevos.tipo = "Selecciona el tipo de activo"
        }
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
            else if (form.tipo === "Equipo Computo" && esDispoAsignado(form.id_dispo, tiposDispo)) {
                nuevos.id_dispo = "Los equipos computacionales no pueden crearse como asignados; complete el checklist de preparación en Inventario"
            }
        }
        if (n === 3 && form.tipo === "Equipo Computo") {
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
        const requiereEmpleado = asignarAhora || esDispoAsignado(form.id_dispo, tiposDispo)
        if (!requiereEmpleado) return true
        const nuevos = {}
        if (!asignacion.id_emp) nuevos.id_emp = "Selecciona el empleado"
        if (!asignacion.fecha_entr) nuevos.fecha_entr = "La fecha de entrega es obligatoria"
        setErrores(nuevos)
        return Object.keys(nuevos).length === 0
    }

    async function enviar() {
        if (!validarAsignacion()) return
        for (const n of [0, 1, 2]) {
            if (!validarPaso(n)) {
                setPaso(n)
                return
            }
        }

        const payload = Object.fromEntries(
            Object.entries(form).filter(([_, v]) => v !== "" && v !== null)
        )
        const crearComoAsignado = esDispoAsignado(form.id_dispo, tiposDispo)
        if (crearComoAsignado) {
            const idDisponible = idDispoDisponible(tiposDispo)
            if (idDisponible == null) {
                await showAlert({
                    title: "Error de guardado",
                    message: "No existe la disponibilidad «disponible» en el catálogo",
                    severity: "error",
                })
                return
            }
            payload.id_dispo = idDisponible
        }
        setGuardando(true)
        try {
            const nuevoActivo = await createActivo(payload)

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
            if ((asignarAhora || crearComoAsignado) && form.tipo !== "Equipo Computo") {
                try {
                    const nuevaAsig = await crearAsignacion({
                        id_act: nuevoActivo.id_act,
                        id_emp: asignacion.id_emp,
                        fecha_entr: asignacion.fecha_entr,
                    })
                    if (asignacion.actaFile) {
                        try {
                            await uploadActa(nuevaAsig.id_asig, asignacion.actaFile)
                        } catch (actaErr) {
                            const detail = actaErr.response?.data?.detail
                            const mensaje = typeof detail === "string"
                                ? detail
                                : "El activo se asignó, pero no se pudo guardar el acta"
                            await showAlert({
                                title: "Error al subir acta",
                                message: mensaje,
                                severity: "warning",
                            })
                            resetFormulario()
                            onCreado?.()
                            onClose?.()
                            return
                        }
                    }
                } catch (asigErr) {
                    const detail = asigErr.response?.data?.detail
                    const mensaje = typeof detail === "string"
                        ? detail
                        : "El activo se creó, pero no se pudo registrar la asignación"
                    await showAlert({
                        title: "Error al asignar",
                        message: mensaje,
                        severity: "warning",
                    })
                    resetFormulario()
                    onCreado?.()
                    onClose?.()
                    return
                }
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
                const data = await existeSerie(form.num_serie.trim())
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
                    {paso === 0 && (
                        <PasoTipo
                            form={form}
                            setForm={setForm}
                            setAsignarAhora={setAsignarAhora}
                            errores={errores}
                            setErrores={setErrores}
                        />
                    )}
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
                            setAsignarAhora={setAsignarAhora}
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
                    ? <Button variant="contained" onClick={siguiente}>Siguiente</Button>
                    : <Button variant="contained" color="success" onClick={enviar} disabled={guardando}>
                        {guardando ? "Guardando…" : "Confirmar"}
                    </Button>
                }
            </DialogActions>
        </Dialog>
    )
}
