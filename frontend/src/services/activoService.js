import axiosClient from "../api/axiosClient";

const getActivos = async () => {
    const response = await axiosClient.get("/ActivoTi")
    return response.data
}

const getActivo = async (id) => {
    const response = await axiosClient.get(`/ActivoTi/${id}`)
    return response.data
}

const deleteActivo = async (id) => {
    const response = await axiosClient.delete(`/ActivoTi/${id}`)
    return response.data
}

const createActivo = async (payload) => {
    const response = await axiosClient.post("/ActivoTi", payload)
    return response.data
}

const updateActivo = async (id, payload) => {
    const response = await axiosClient.put(`/ActivoTi/${id}`, payload)
    return response.data
}


export { getActivos, getActivo, deleteActivo, createActivo, updateActivo }