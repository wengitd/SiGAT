import { useEffect, useState } from "react"
import { Box, TextField, Autocomplete, Button, Typography } from "@mui/material"
import UploadFileIcon from "@mui/icons-material/UploadFile"
import { ACTA_ACCEPT, esArchivoActaValido, esPdfActa } from "../actaFileUtils"

function hoy() {
    return new Date().toISOString().slice(0, 10)
}

// Etiqueta legible para un activo en el dropdown
function labelActivo(a) {
    return `${a.nombre_marca ?? ""} ${a.nombre_modelo ?? ""} — N° serie ${a.num_serie ?? "s/n"}`.trim()
}

/**
 * Formulario reutilizable de asignación activo <-> empleado.
 * Se usa embebido tanto en un modal (Inventario, Empleados) como
 * dentro del Stepper de creación de activo.
 *
 * - Si se pasa `activoFijo`, el activo se muestra fijo (no editable) y no se listan opciones.
 * - Si se pasa `empleadoFijo`, el empleado se muestra fijo (no editable) y no se listan opciones.
 * - `ocultarActivo` oculta por completo el selector de activo (caso: activo aún no existe).
 * - `errores` mapa opcional de mensajes por campo (id_emp, fecha_entr, id_act, actaFile).
 * - `value.actaFile` es el File opcional del acta de entrega (PDF o imagen).
 */
export default function AsignacionForm({
    value, onChange,
    activoFijo = null, empleadoFijo = null,
    activosOpciones = [], empleadosOpciones = [],
    ocultarActivo = false,
    errores = {},
}) {
    const [previewUrl, setPreviewUrl] = useState(null)
    const [errorLocal, setErrorLocal] = useState("")

    function set(campo, valor) {
        onChange({ ...value, [campo]: valor })
    }

    useEffect(() => {
        const file = value.actaFile
        if (!file) {
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
            return
        }
        const url = URL.createObjectURL(file)
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return url
        })
        return () => URL.revokeObjectURL(url)
    }, [value.actaFile])

    function onActaFileChange(e) {
        const file = e.target.files?.[0] ?? null
        e.target.value = ""
        if (!file) {
            setErrorLocal("")
            set("actaFile", null)
            return
        }
        if (!esArchivoActaValido(file)) {
            setErrorLocal("Solo se permiten PDF, JPG, PNG o WEBP")
            set("actaFile", null)
            return
        }
        setErrorLocal("")
        set("actaFile", file)
    }

    const empleadoSeleccionado = empleadosOpciones.find(e => e.id_emp === value.id_emp) ?? null
    const activoSeleccionado = activosOpciones.find(a => a.id_act === value.id_act) ?? null
    const errorActa = errores.actaFile || errorLocal

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>

            {!ocultarActivo && (
                activoFijo
                    ? <TextField label="Activo" value={activoFijo.label} disabled fullWidth />
                    : (
                        <Autocomplete
                            fullWidth
                            options={activosOpciones}
                            value={activoSeleccionado}
                            getOptionLabel={(a) => labelActivo(a)}
                            isOptionEqualToValue={(a, b) => a.id_act === b.id_act}
                            onChange={(_, opt) => set("id_act", opt?.id_act ?? "")}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Activo"
                                    error={!!errores.id_act}
                                    helperText={errores.id_act || (activosOpciones.length === 0
                                        ? "No hay activos disponibles para asignar"
                                        : "")}
                                />
                            )}
                        />
                    )
            )}

            {empleadoFijo
                ? <TextField label="Empleado" value={empleadoFijo.label} disabled fullWidth />
                : (
                    <Autocomplete
                        fullWidth
                        options={empleadosOpciones}
                        value={empleadoSeleccionado}
                        getOptionLabel={(e) => e.nombre ?? ""}
                        isOptionEqualToValue={(a, b) => a.id_emp === b.id_emp}
                        onChange={(_, opt) => set("id_emp", opt?.id_emp ?? "")}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Empleado"
                                error={!!errores.id_emp}
                                helperText={errores.id_emp}
                            />
                        )}
                    />
                )
            }

            <TextField
                label="Fecha de entrega"
                type="date"
                value={value.fecha_entr}
                onChange={(e) => set("fecha_entr", e.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoy() } }}
                fullWidth
                error={!!errores.fecha_entr}
                helperText={errores.fecha_entr}
            />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                    Acta de entrega (opcional)
                </Typography>
                <Button
                    component="label"
                    variant="outlined"
                    startIcon={<UploadFileIcon />}
                    sx={{ alignSelf: "flex-start" }}
                >
                    {value.actaFile ? value.actaFile.name : "Adjuntar PDF o imagen"}
                    <input
                        type="file"
                        hidden
                        accept={ACTA_ACCEPT}
                        onChange={onActaFileChange}
                    />
                </Button>
                {value.actaFile && (
                    <Button
                        size="small"
                        onClick={() => set("actaFile", null)}
                        sx={{ alignSelf: "flex-start" }}
                    >
                        Quitar archivo
                    </Button>
                )}
                {errorActa && (
                    <Typography variant="caption" color="error">{errorActa}</Typography>
                )}
                {previewUrl && (
                    esPdfActa(value.actaFile)
                        ? (
                            <Box
                                component="iframe"
                                title="Vista previa acta"
                                src={previewUrl}
                                sx={{
                                    width: "100%",
                                    height: 240,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 1,
                                }}
                            />
                        )
                        : (
                            <Box
                                component="img"
                                alt="Vista previa acta"
                                src={previewUrl}
                                sx={{
                                    maxWidth: "100%",
                                    maxHeight: 240,
                                    objectFit: "contain",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 1,
                                    bgcolor: "grey.50",
                                }}
                            />
                        )
                )}
            </Box>
        </Box>
    )
}
