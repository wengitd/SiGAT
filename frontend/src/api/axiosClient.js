import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8000",
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
la sesión local queda inválida: se limpia y se manda a login en vez de
dejar el menú visible con las tablas vacías. */
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;