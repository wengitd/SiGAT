import axiosClient from "../../core/http/axiosClient";

export async function getUsuarios() {
  const { data } = await axiosClient.get("/usuario_sistema/");
  return data;
}

export async function createUsuario(payload) {
  const { data } = await axiosClient.post("/usuario_sistema/", payload);
  return data;
}

export async function updateUsuario(id, payload) {
  const { data } = await axiosClient.put(`/usuario_sistema/${id}`, payload);
  return data;
}

export async function deleteUsuario(id) {
  await axiosClient.delete(`/usuario_sistema/${id}`);
}
