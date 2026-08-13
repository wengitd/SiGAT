import axiosClient from "../../core/http/axiosClient";

export async function getSolicitudesBaja(params = {}) {
  const { data } = await axiosClient.get("/solicitudes-baja/", { params });
  return data;
}

export async function crearSolicitudBaja(payload) {
  const { data } = await axiosClient.post("/solicitudes-baja/", payload);
  return data;
}

export async function resolverSolicitudBaja(id, payload) {
  const { data } = await axiosClient.put(`/solicitudes-baja/${id}/resolver`, payload);
  return data;
}

export async function registrarBorradoSolicitud(id, payload) {
  const { data } = await axiosClient.put(`/solicitudes-baja/${id}/borrado`, payload);
  return data;
}
