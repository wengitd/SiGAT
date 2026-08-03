import axiosClient from "../api/axiosClient"

export async function getChecklistsPorActivo(idAct) {
    const { data } = await axiosClient.get(`/Checklist/activo/${idAct}`)
    return data
}

export async function getElegibilidad(idAct) {
    const { data } = await axiosClient.get(`/Checklist/activo/${idAct}/elegibilidad`)
    return data
}

export async function iniciarChecklist(idAct, proposito, idPlantilla) {
    const { data } = await axiosClient.post("/Checklist/iniciar", {
        id_act: idAct,
        proposito,
        id_plantilla: idPlantilla,
    })
    return data
}

export async function actualizarPasoChecklist(idCpaso, payload) {
    const { data } = await axiosClient.put(`/Checklist/pasos/${idCpaso}`, payload)
    return data
}

export async function cerrarChecklist(idCheck) {
    const { data } = await axiosClient.post(`/Checklist/${idCheck}/cerrar`)
    return data
}

export async function cancelarChecklist(idCheck) {
    const { data } = await axiosClient.post(`/Checklist/${idCheck}/cancelar`)
    return data
}

export function resumenChecklist(checklist) {
    if (!checklist?.pasos?.length) {
        return { total: 0, resueltos: 0, label: "Sin pasos" }
    }
    const total = checklist.pasos.length
    const resueltos = checklist.pasos.filter(
        (p) => p.estado === "completado" || p.estado === "no_aplica",
    ).length
    return {
        total,
        resueltos,
        label: `${resueltos}/${total}`,
    }
}
