import axiosClient from "../api/axiosClient";

const getActivos = async () =>{
    const response = await axiosClient.get("/ActivoTi")
    return response.data
}

const getActivo = async (id) =>{ 
    const response = await axiosClient.get(`/ActivoTi/${id}`)
    return response.data    
}

const deleteActivo =async() =>{
    const response = await axiosClient.delete(`/ActivoTi/${id}`) 
    return response.data
}   


export {getActivos, getActivo, deleteActivo}