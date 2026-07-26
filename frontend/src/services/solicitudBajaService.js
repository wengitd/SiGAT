import axiosClient from "../api/axiosClient";

const getSolicitudesBaja = async (params = {}) => {
    const response = await axiosClient.get("/solicitudes-baja/", { params })
    return response.data
}

const crearSolicitudBaja = async (payload) => {
    const response = await axiosClient.post("/solicitudes-baja/", payload)
    return response.data
}

const resolverSolicitudBaja = async (id, payload) => {
    const response = await axiosClient.put(`/solicitudes-baja/${id}/resolver`, payload)
    return response.data
}

const registrarBorradoSolicitud = async (id, payload) => {
    const response = await axiosClient.put(`/solicitudes-baja/${id}/borrado`, payload)
    return response.data
}

export { getSolicitudesBaja, crearSolicitudBaja, resolverSolicitudBaja, registrarBorradoSolicitud }
