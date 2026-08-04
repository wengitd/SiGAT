import axiosClient from "../api/axiosClient";

const getResumenDashboard = async (anio) => {
    const response = await axiosClient.get("/dashboard/resumen", {
        params: anio ? { anio } : undefined,
    })
    return response.data
}

export { getResumenDashboard }
