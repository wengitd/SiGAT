import axiosClient from "../../core/http/axiosClient";

export async function getEmpleados() {
  const { data } = await axiosClient.get("/empleado/");
  return data;
}

export async function getEmpleadosOperativos() {
  const empleados = await getEmpleados();
  return empleados.filter((e) => e.operatividad);
}

export async function createEmpleado(payload) {
  const { data } = await axiosClient.post("/empleado/", payload);
  return data;
}

export async function updateEmpleado(id, payload) {
  const { data } = await axiosClient.put(`/empleado/${id}`, payload);
  return data;
}

export async function deleteEmpleado(id) {
  await axiosClient.delete(`/empleado/${id}`);
}
