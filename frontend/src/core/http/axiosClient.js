import axios from "axios";
import { isTokenExpired } from "../auth/jwt";

// En desarrollo: http://localhost:8000
// En produccion (build): /api (Nginx hace proxy al backend)
const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});


/*Interceptor que lea el token de localStorage y lo adjunte a cada request automaticamente */
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/*Si el backend rechaza el token (venció, o el usuario fue desactivado),
la sesión local queda inválida: se limpia y se manda a login*/
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && window.location.pathname !== "/login") {
            const staleToken = localStorage.getItem("token");
            const reason = staleToken && isTokenExpired(staleToken) ? "expired" : "invalid";
            localStorage.removeItem("token");
            window.location.href = `/login?reason=${reason}`;
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
