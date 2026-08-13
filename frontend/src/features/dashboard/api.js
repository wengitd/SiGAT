import axiosClient from "../../core/http/axiosClient";

export async function getResumenDashboard(anio) {
  const { data } = await axiosClient.get("/dashboard/resumen", {
    params: anio ? { anio } : undefined,
  });
  return data;
}
