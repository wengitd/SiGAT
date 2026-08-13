import axiosClient from "../../core/http/axiosClient";

/** Login OAuth2 password form → { access_token, token_type }. */
export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  const { data } = await axiosClient.post("/auth/login", formData);
  return data;
}

/** Renueva el JWT de la sesión actual. */
export async function renewSession() {
  const { data } = await axiosClient.post("/auth/renew");
  return data;
}
