import axiosClient from "../../core/http/axiosClient";

export async function getActivos(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v != null),
  );
  const { data } = await axiosClient.get("/ActivoTi/", { params: cleaned });
  return data;
}

export async function getActivo(id) {
  const { data } = await axiosClient.get(`/ActivoTi/${id}`);
  return data;
}

export async function createActivo(payload) {
  const { data } = await axiosClient.post("/ActivoTi/", payload);
  return data;
}

export async function updateActivo(id, payload) {
  const { data } = await axiosClient.put(`/ActivoTi/${id}`, payload);
  return data;
}

export async function deleteActivo(id) {
  const { data } = await axiosClient.delete(`/ActivoTi/${id}`);
  return data;
}

export async function existeSerie(num_serie) {
  const { data } = await axiosClient.get("/ActivoTi/existe-serie", {
    params: { num_serie },
  });
  return data;
}

export async function sugerenciasCpu() {
  const { data } = await axiosClient.get("/ActivoTi/sugerencias/cpu");
  return data;
}

export async function sugerenciasUMedida() {
  const { data } = await axiosClient.get("/ActivoTi/sugerencias/u-medida");
  return data;
}
