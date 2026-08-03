import axiosClient from "../api/axiosClient";

const getTrazabilidadActivo = async (id_act) => {
    const response = await axiosClient.get(`/trazabilidad/activo/${id_act}`);
    return response.data;
};

const getTrazabilidadEmpleado = async (id_emp) => {
    const response = await axiosClient.get(`/trazabilidad/empleado/${id_emp}`);
    return response.data;
};

export { getTrazabilidadActivo, getTrazabilidadEmpleado };
