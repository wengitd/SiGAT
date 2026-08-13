import axiosClient from "../../core/http/axiosClient";

export async function uploadFactura({ id_act, fecha_em, file }) {
  const formData = new FormData();
  formData.append("id_act", String(id_act));
  formData.append("fecha_em", fecha_em);
  formData.append("file", file);
  const { data } = await axiosClient.post("/factura/upload", formData);
  return data;
}

export async function replaceFacturaPdf(id_fact, file, fecha_em = null) {
  const formData = new FormData();
  formData.append("file", file);
  if (fecha_em) formData.append("fecha_em", fecha_em);
  const { data } = await axiosClient.put(`/factura/${id_fact}/pdf`, formData);
  return data;
}

export async function fetchFacturaPdfBlobUrl(id_fact) {
  const { data } = await axiosClient.get(`/factura/${id_fact}/pdf`, {
    responseType: "blob",
  });
  return URL.createObjectURL(data);
}
