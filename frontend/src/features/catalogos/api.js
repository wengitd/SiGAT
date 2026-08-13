import axiosClient from "../../core/http/axiosClient";

/** CRUD genérico usado por MantenedorCatalogo. */
export async function listCatalog(endpoint) {
  const { data } = await axiosClient.get(`${endpoint}/`);
  return data;
}

export async function createCatalog(endpoint, payload) {
  const { data } = await axiosClient.post(`${endpoint}/`, payload);
  return data;
}

export async function updateCatalog(endpoint, id, payload) {
  const { data } = await axiosClient.put(`${endpoint}/${id}`, payload);
  return data;
}

export async function deleteCatalog(endpoint, id) {
  await axiosClient.delete(`${endpoint}/${id}`);
}

export async function ensureMarca(nombre) {
  const { data } = await axiosClient.post("/marcas/ensure", { nombre });
  return data;
}

export async function ensureModelo(nombre, id_marca) {
  const { data } = await axiosClient.post("/modelos/ensure", { nombre, id_marca });
  return data;
}

export async function ensureTipoEquipo(nombre) {
  const { data } = await axiosClient.post("/tipos-equipo/ensure", { nombre });
  return data;
}

export async function ensureTipoPeriferico(nombre) {
  const { data } = await axiosClient.post("/tipos-periferico/ensure", { nombre });
  return data;
}

export async function getMarcas() {
  const { data } = await axiosClient.get("/marcas/");
  return data;
}

export async function getModelos() {
  const { data } = await axiosClient.get("/modelos/");
  return data;
}

export async function getTiposEstado() {
  const { data } = await axiosClient.get("/tipos-estado/");
  return data;
}

export async function getDisponibilidades() {
  const { data } = await axiosClient.get("/disponibilidades/");
  return data;
}

export async function getDisponibilidadesPorEstado(id_tipoe) {
  const { data } = await axiosClient.get(`/disponibilidades/por-estado/${id_tipoe}`);
  return data;
}

export async function getTiposEquipo() {
  const { data } = await axiosClient.get("/tipos-equipo/");
  return data;
}

export async function getTiposPeriferico() {
  const { data } = await axiosClient.get("/tipos-periferico/");
  return data;
}

export async function getFamiliasSO() {
  const { data } = await axiosClient.get("/sistemas-operativos/familias");
  return data;
}

export async function getVersionesSO(id_fam) {
  const url = id_fam
    ? `/sistemas-operativos/versiones/por-familia/${id_fam}`
    : "/sistemas-operativos/versiones";
  const { data } = await axiosClient.get(url);
  return data;
}

export async function getEdicionesSO(id_ver) {
  const url = id_ver
    ? `/sistemas-operativos/ediciones/por-version/${id_ver}`
    : "/sistemas-operativos/ediciones";
  const { data } = await axiosClient.get(url);
  return data;
}

export async function getRelacionesEstadoDispo() {
  const { data } = await axiosClient.get("/disponibilidades/relaciones");
  return data;
}

export async function createRelacionEstadoDispo(payload) {
  const { data } = await axiosClient.post("/disponibilidades/relaciones", payload);
  return data;
}

export async function deleteRelacionEstadoDispo(id_tipoe, id_dispo) {
  await axiosClient.delete(`/disponibilidades/relaciones/${id_tipoe}/${id_dispo}`);
}

// SO CRUD (mantenedor)
export async function createFamiliaSO(payload) {
  const { data } = await axiosClient.post("/sistemas-operativos/familias", payload);
  return data;
}
export async function updateFamiliaSO(id, payload) {
  const { data } = await axiosClient.put(`/sistemas-operativos/familias/${id}`, payload);
  return data;
}
export async function deleteFamiliaSO(id) {
  await axiosClient.delete(`/sistemas-operativos/familias/${id}`);
}
export async function createVersionSO(payload) {
  const { data } = await axiosClient.post("/sistemas-operativos/versiones", payload);
  return data;
}
export async function updateVersionSO(id, payload) {
  const { data } = await axiosClient.put(`/sistemas-operativos/versiones/${id}`, payload);
  return data;
}
export async function deleteVersionSO(id) {
  await axiosClient.delete(`/sistemas-operativos/versiones/${id}`);
}
export async function createEdicionSO(payload) {
  const { data } = await axiosClient.post("/sistemas-operativos/ediciones", payload);
  return data;
}
export async function updateEdicionSO(id, payload) {
  const { data } = await axiosClient.put(`/sistemas-operativos/ediciones/${id}`, payload);
  return data;
}
export async function deleteEdicionSO(id) {
  await axiosClient.delete(`/sistemas-operativos/ediciones/${id}`);
}
