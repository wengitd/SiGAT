import { Box, Typography, Alert, Checkbox, FormControlLabel } from "@mui/material"
import AsignacionForm from "../../../asignaciones/components/AsignacionForm"
import { esDispoAsignado, limpiarError } from "./constants"

export function FilaResumen({ label, valor }) {
    return (
        <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ fontWeight: 600, minWidth: 170 }}>{label}:</Typography>
            <Typography color="text.secondary">{valor || "—"}</Typography>
        </Box>
    )
}

export function SeccionResumen({ titulo, filas }) {
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

export function PasoResumen({ form, tiposEstado, tiposDispo, tiposEquipo, tiposPerif, factura, marcas, modelos, familiasSO, versionesSO, edicionesSO,
    asignarAhora, setAsignarAhora, asignacion, setAsignacion, empleadosOpciones, errores, setErrores }) {
    const nombreEstado = tiposEstado.find(t => t.id_tipoe === form.id_tipoe)?.nombre
    const nombreDispo = tiposDispo.find(d => d.id_dispo === form.id_dispo)?.nombre
    const requiereEmpleado = esDispoAsignado(form.id_dispo, tiposDispo)
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
        ["Tipo", form.tipo === "Equipo Computo" ? "Computacional" : "Periférico"],
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
            {form.tipo === "Equipo Computo"
                ? <SeccionResumen titulo="Datos técnicos — Computacional" filas={seccionComputacional} />
                : <SeccionResumen titulo="Datos técnicos — Periférico" filas={seccionPeriferico} />
            }

            {form.tipo === "Equipo Computo" ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Los equipos computacionales deben completar el checklist de preparación en Inventario antes de asignarse.
                </Alert>
            ) : (
                <>
                    {requiereEmpleado ? (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            La disponibilidad «asignado» requiere seleccionar el empleado correspondiente.
                        </Alert>
                    ) : (
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
                    )}
                    {(asignarAhora || requiereEmpleado) &&
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
