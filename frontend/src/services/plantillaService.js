import axiosClient from "../api/axiosClient"

export async function getPlantillas({ proposito, vigente } = {}) {
    const params = {}
    if (proposito != null) params.proposito = proposito
    if (vigente != null) params.vigente = vigente
    const { data } = await axiosClient.get("/Plantilla/", { params })
    return data
}

export async function crearPlantilla(payload) {
    const { data } = await axiosClient.post("/Plantilla/", payload)
    return data
}

export async function actualizarPlantilla(id, payload) {
    const { data } = await axiosClient.put(`/Plantilla/${id}`, payload)
    return data
}

export async function agregarPaso(idPlantilla, payload) {
    const { data } = await axiosClient.post(`/Plantilla/${idPlantilla}/pasos`, payload)
    return data
}

export async function actualizarPaso(idPaso, payload) {
    const { data } = await axiosClient.put(`/Plantilla/pasos/${idPaso}`, payload)
    return data
}

export async function desactivarPaso(idPaso) {
    await axiosClient.delete(`/Plantilla/pasos/${idPaso}`)
}
