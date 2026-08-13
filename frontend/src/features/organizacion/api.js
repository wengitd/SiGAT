import axiosClient from "../../core/http/axiosClient";

export async function getEmpresas() {
  const { data } = await axiosClient.get("/empresas/");
  return data;
}

export async function getDepartamentos() {
  const { data } = await axiosClient.get("/departamento/");
  return data;
}

export async function createDepartamento(payload) {
  const { data } = await axiosClient.post("/departamento/", payload);
  return data;
}

export async function updateDepartamento(id, payload) {
  const { data } = await axiosClient.put(`/departamento/${id}`, payload);
  return data;
}

export async function getSubAreas(id_dpto) {
  const { data } = await axiosClient.get("/sub-areas/", {
    params: id_dpto != null ? { id_dpto } : undefined,
  });
  return data;
}

export async function createSubArea(payload) {
  const { data } = await axiosClient.post("/sub-areas/", payload);
  return data;
}

export async function deleteSubArea(id) {
  await axiosClient.delete(`/sub-areas/${id}`);
}

export async function getCargos() {
  const { data } = await axiosClient.get("/cargos/");
  return data;
}

export async function getPlantas() {
  const { data } = await axiosClient.get("/plantas/");
  return data;
}
