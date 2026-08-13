import ComputerIcon from "@mui/icons-material/Computer"
import DevicesOtherIcon from "@mui/icons-material/DevicesOther"

export function hoy() {
    return new Date().toISOString().slice(0, 10)
}

export const PASOS = ["Tipo de activo", "Datos generales", "Estado", "Datos técnicos", "Resumen"]

export const RAM_CAPACIDADES = [2, 4, 6, 8, 10, 12, 16, 20]
export const RAM_TIPOS = ["DDR3", "DDR4", "DDR5"]
export const U_MEDIDA_PRESETS = ["pulgadas", "VA", "ppm", "kg", "W"]

export const FORM_INICIAL = {
    tipo: "",
    id_modelo: "", num_serie: "", origen: "Empresa", fecha_recep: "",
    id_tipoe: "", id_dispo: "",
    cpu: "", ram_capac: 8, ram_tipo: "",
    disco_tipo: "", disco_unidad: "", disco_capac: "",
    host_name: "", mac_ethernet: "", mac_wifi: "",
    id_tipoeq: "", id_edicion_so: "",
    valor_tec: "", u_medida: "", obs_perif: "", id_tipoper: "",
}

export const FACTURA_INICIAL = {
    fecha_em: "",
    file: null,
}

// Normaliza a formato XX:XX:XX:XX:XX:XX (6 pares hexadecimales, máx. 17 caracteres)
export function formatMac(valor) {
    const hex = valor.replace(/[^0-9a-fA-F]/g, "").toUpperCase().slice(0, 12)
    return hex.match(/.{1,2}/g)?.join(":") ?? ""
}

export function macIncompleta(valor) {
    if (!valor) return false
    return valor.replace(/:/g, "").length > 0 && valor.replace(/:/g, "").length < 12
}

export const TIPOS = [
    { valor: "Equipo Computo", label: "Computacional", icon: <ComputerIcon sx={{ fontSize: 48 }} /> },
    { valor: "Periferico", label: "Periférico", icon: <DevicesOtherIcon sx={{ fontSize: 48 }} /> },
]

export function limpiarError(setErrores, campo) {
    setErrores(prev => {
        if (!prev[campo]) return prev
        const next = { ...prev }
        delete next[campo]
        return next
    })
}

/** True si la disponibilidad corresponde a "asignado" (sin importar mayúsculas). */
export function esDispoAsignado(id_dispo, tiposDispo) {
    if (id_dispo === "" || id_dispo == null || !tiposDispo?.length) return false
    const dispo = tiposDispo.find(d => d.id_dispo === id_dispo)
    return dispo?.nombre?.toLowerCase() === "asignado"
}

/** Id de la disponibilidad "disponible", o null si no está en el catálogo. */
export function idDispoDisponible(tiposDispo) {
    return tiposDispo?.find(d => d.nombre?.toLowerCase() === "disponible")?.id_dispo ?? null
}

