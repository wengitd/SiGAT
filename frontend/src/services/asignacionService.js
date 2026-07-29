import axiosClient from "../api/axiosClient";

const crearAsignacion = async (payload) => {
    const response = await axiosClient.post("/asignaciones/", payload)
    return response.data
}

export { crearAsignacion }
