import axiosClient from "../../core/http/axiosClient";

export async function getTrazabilidadActivo(id_act) {
  const { data } = await axiosClient.get(`/trazabilidad/activo/${id_act}`);
  return data;
}

export async function getTrazabilidadEmpleado(id_emp) {
  const { data } = await axiosClient.get(`/trazabilidad/empleado/${id_emp}`);
  return data;
}
