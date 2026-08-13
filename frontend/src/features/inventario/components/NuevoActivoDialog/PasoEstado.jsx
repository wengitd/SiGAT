import { useEffect, useState } from "react"
import { Box, Autocomplete, TextField } from "@mui/material"
import { getDisponibilidadesPorEstado } from "../../../catalogos/api"
import { limpiarError } from "./constants"

export function PasoEstado({ form, setForm, tiposEstado, setAsignarAhora, errores, setErrores }) {
    const [dispoPermitidas, setDispoPermitidas] = useState([])

    useEffect(() => {
        if (!form.id_tipoe) { setDispoPermitidas([]); return }
        getDisponibilidadesPorEstado(form.id_tipoe).then(setDispoPermitidas)
            .catch(() => setDispoPermitidas([]))
    }, [form.id_tipoe])

    const esComputacional = form.tipo === "Equipo Computo"
    const opcionesDispo = esComputacional
        ? dispoPermitidas.filter(d => d.nombre?.toLowerCase() !== "asignado")
        : dispoPermitidas

    useEffect(() => {
        if (!esComputacional || !form.id_dispo) return
        const actual = dispoPermitidas.find(d => d.id_dispo === form.id_dispo)
        if (actual?.nombre?.toLowerCase() === "asignado") {
            setForm(prev => ({ ...prev, id_dispo: "" }))
            setAsignarAhora(false)
        }
    }, [esComputacional, form.id_dispo, dispoPermitidas, setForm, setAsignarAhora])

    const condicionSeleccionada = tiposEstado.find(t => t.id_tipoe === form.id_tipoe) ?? null
    const dispoSeleccionada = opcionesDispo.find(d => d.id_dispo === form.id_dispo) ?? null

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
                options={opcionesDispo}
                value={dispoSeleccionada}
                getOptionLabel={(d) => d.nombre ?? ""}
                isOptionEqualToValue={(a, b) => a.id_dispo === b.id_dispo}
                onChange={(_, opt) => {
                    setForm(prev => ({ ...prev, id_dispo: opt?.id_dispo ?? "" }))
                    limpiarError(setErrores, "id_dispo")
                    if (opt?.nombre?.toLowerCase() === "asignado") {
                        setAsignarAhora(true)
                    }
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Disponibilidad"
                        required
                        error={!!errores.id_dispo}
                        helperText={
                            errores.id_dispo
                            || (esComputacional && form.id_tipoe
                                ? "Los equipos computacionales se asignan después del checklist de preparación."
                                : undefined)
                        }
                    />
                )}
            />
        </Box>
    )
}

