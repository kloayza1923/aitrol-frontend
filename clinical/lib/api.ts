import axios from "axios";
import { useClinicalStore } from "@/store/clinicalStore";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "/services";

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const { token, sucursalId } = useClinicalStore.getState();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (sucursalId) {
    config.headers = config.headers ?? {};
    config.headers["x-sucursal-id"] = String(sucursalId);
  }
  return config;
});
