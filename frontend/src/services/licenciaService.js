import axiosClient from "../api/axiosClient";

/** Lista contratos de licencia (con proveedor y versión). */
const getLicencias = async () => {
    const response = await axiosClient.get("/licencia/");
    return response.data;
};

/** Lista asignaciones de licencia de un empleado. */
const getAsignaciones = async (id_emp) => {
    const response = await axiosClient.get("/emp_licencias/", {
        params: { id_emp },
    });
    return response.data;
};

/** Asigna una licencia a un empleado. */
const asignarLicencia = async ({ id_emp, id_lic }) => {
    const response = await axiosClient.post("/emp_licencias/", { id_emp, id_lic });
    return response.data;
};

/** Quita la asignación empleado–licencia. */
const desasignarLicencia = async (id_emp, id_lic) => {
    await axiosClient.delete(`/emp_licencias/${id_emp}/${id_lic}`);
};

export { getLicencias, getAsignaciones, asignarLicencia, desasignarLicencia };
