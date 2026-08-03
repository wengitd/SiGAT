import axiosClient from "../api/axiosClient";

const crearAsignacion = async (payload) => {
    const response = await axiosClient.post("/asignaciones/", payload);
    return response.data;
};

const devolverAsignacion = async (id_asig, fecha_dev) => {
    const response = await axiosClient.put(`/asignaciones/${id_asig}`, { fecha_dev });
    return response.data;
};

export { crearAsignacion, devolverAsignacion };
