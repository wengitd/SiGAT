import { useState } from "react"
import { Autocomplete, TextField, createFilterOptions } from "@mui/material"

const CREATE_MARKER = "__crear__"
const filter = createFilterOptions()

/**
 * Autocomplete buscable con opción opcional de crear un valor en línea.
 * Si el texto no coincide con ninguna opción, muestra "Crear «X»" y llama a onCreate.
 */
export default function CreatableAutocomplete({
    options = [],
    value = null,
    onChange,
    onCreate,
    getOptionLabel = (o) => (typeof o === "string" ? o : (o?.nombre ?? "")),
    isOptionEqualToValue = (a, b) => a === b,
    label,
    disabled = false,
    error = false,
    helperText = "",
    required = false,
    creatable = true,
    loading = false,
    fullWidth = true,
    sx,
}) {
    const [creando, setCreando] = useState(false)
    const ocupado = disabled || creando || loading

    return (
        <Autocomplete
            fullWidth={fullWidth}
            sx={sx}
            options={options}
            value={value}
            disabled={ocupado}
            loading={creando || loading}
            getOptionLabel={(option) => {
                if (typeof option === "string") return option
                if (option?.[CREATE_MARKER]) return option.inputValue
                return getOptionLabel(option)
            }}
            isOptionEqualToValue={(a, b) => {
                if (a?.[CREATE_MARKER] || b?.[CREATE_MARKER]) return false
                if (a == null || b == null) return a === b
                return isOptionEqualToValue(a, b)
            }}
            filterOptions={(opts, params) => {
                const filtradas = filter(opts, params)
                const input = params.inputValue.trim()
                if (
                    creatable
                    && typeof onCreate === "function"
                    && input
                    && !opts.some((o) => getOptionLabel(o).toLowerCase() === input.toLowerCase())
                ) {
                    filtradas.push({
                        [CREATE_MARKER]: true,
                        inputValue: input,
                    })
                }
                return filtradas
            }}
            renderOption={(props, option) => {
                const { key, ...rest } = props
                return (
                    <li
                        key={option?.[CREATE_MARKER] ? `${CREATE_MARKER}-${option.inputValue}` : key}
                        {...rest}
                    >
                        {option?.[CREATE_MARKER]
                            ? `Crear «${option.inputValue}»`
                            : getOptionLabel(option)}
                    </li>
                )
            }}
            onChange={async (_, nueva) => {
                if (nueva?.[CREATE_MARKER]) {
                    setCreando(true)
                    try {
                        const creada = await onCreate(nueva.inputValue.trim())
                        onChange?.(creada ?? null)
                    } catch (err) {
                        console.error(err)
                    } finally {
                        setCreando(false)
                    }
                    return
                }
                onChange?.(nueva)
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    required={required}
                    error={error}
                    helperText={helperText}
                />
            )}
        />
    )
}
