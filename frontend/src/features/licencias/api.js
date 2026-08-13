import axiosClient from "../../core/http/axiosClient";

export async function getVersionesLicencia() {
  const { data } = await axiosClient.get("/versiones-licencia/");
  return data;
}

export async function getProveedoresLicencia() {
  const { data } = await axiosClient.get("/proveedores-licencia/");
  return data;
}

export async function getAsignacionesLicencia(id_emp) {
  const { data } = await axiosClient.get("/emp_licencias/", { params: { id_emp } });
  return data;
}

export async function asignarLicencia({ id_emp, id_ver }) {
  const { data } = await axiosClient.post("/emp_licencias/", { id_emp, id_ver });
  return data;
}

export async function desasignarLicencia(id_emp, id_ver) {
  await axiosClient.delete(`/emp_licencias/${id_emp}/${id_ver}`);
}
