import axiosClient from "../../core/http/axiosClient";

export async function crearAsignacion(payload) {
  const { data } = await axiosClient.post("/asignaciones/", payload);
  return data;
}

export async function devolverAsignacion(id_asig, fecha_dev) {
  const { data } = await axiosClient.put(`/asignaciones/${id_asig}`, { fecha_dev });
  return data;
}

export async function uploadActa(id_asig, file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await axiosClient.post(`/asignaciones/${id_asig}/acta`, formData);
  return data;
}

export async function fetchActaBlob(id_asig) {
  const { data, headers } = await axiosClient.get(`/asignaciones/${id_asig}/acta`, {
    responseType: "blob",
  });
  return {
    url: URL.createObjectURL(data),
    mime: headers["content-type"] || data.type || null,
  };
}

export async function fetchActaBlobUrl(id_asig) {
  const { url } = await fetchActaBlob(id_asig);
  return url;
}

export async function replaceActa(id_asig, file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await axiosClient.put(`/asignaciones/${id_asig}/acta`, formData);
  return data;
}
