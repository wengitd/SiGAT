import axiosClient from "../../core/http/axiosClient";

export async function getChecklistsPorActivo(idAct) {
  const { data } = await axiosClient.get(`/Checklist/activo/${idAct}`);
  return data;
}

export async function getElegibilidad(idAct) {
  const { data } = await axiosClient.get(`/Checklist/activo/${idAct}/elegibilidad`);
  return data;
}

export async function iniciarChecklist(idAct, proposito, idPlantilla) {
  const { data } = await axiosClient.post("/Checklist/iniciar", {
    id_act: idAct,
    proposito,
    id_plantilla: idPlantilla,
  });
  return data;
}

export async function actualizarPasoChecklist(idCpaso, payload) {
  const { data } = await axiosClient.put(`/Checklist/pasos/${idCpaso}`, payload);
  return data;
}

export async function cerrarChecklist(idCheck) {
  const { data } = await axiosClient.post(`/Checklist/${idCheck}/cerrar`);
  return data;
}

export async function cancelarChecklist(idCheck) {
  const { data } = await axiosClient.post(`/Checklist/${idCheck}/cancelar`);
  return data;
}

export function resumenChecklist(checklist) {
  if (!checklist?.pasos?.length) {
    return {
      total: 0,
      completados: 0,
      noAplica: 0,
      resueltos: 0,
      label: "Sin pasos",
      labelNoAplica: null,
    };
  }
  const total = checklist.pasos.length;
  const completados = checklist.pasos.filter((p) => p.estado === "Completado").length;
  const noAplica = checklist.pasos.filter((p) => p.estado === "No Aplica").length;
  const resueltos = completados + noAplica;
  return {
    total,
    completados,
    noAplica,
    resueltos,
    label: `${completados}/${total}`,
    labelNoAplica: noAplica > 0 ? `${noAplica} no aplican` : null,
  };
}

export async function getPlantillas({ proposito, vigente } = {}) {
  const params = {};
  if (proposito != null) params.proposito = proposito;
  if (vigente != null) params.vigente = vigente;
  const { data } = await axiosClient.get("/Plantilla/", { params });
  return data;
}

export async function crearPlantilla(payload) {
  const { data } = await axiosClient.post("/Plantilla/", payload);
  return data;
}

export async function actualizarPlantilla(id, payload) {
  const { data } = await axiosClient.put(`/Plantilla/${id}`, payload);
  return data;
}

export async function agregarPaso(idPlantilla, payload) {
  const { data } = await axiosClient.post(`/Plantilla/${idPlantilla}/pasos`, payload);
  return data;
}

export async function actualizarPaso(idPaso, payload) {
  const { data } = await axiosClient.put(`/Plantilla/pasos/${idPaso}`, payload);
  return data;
}

export async function desactivarPaso(idPaso) {
  await axiosClient.delete(`/Plantilla/pasos/${idPaso}`);
}
