// frontend/src/api.js
import axios from "axios";

// Axios instance with base URL pointing to Node.js + Express backend
const API = axios.create({
  baseURL: "http://localhost:5000/api",
});
// Interceptor to attach JWT token from localStorage to all requests
API.interceptors.request.use((config) => {
  // read token from sessionStorage (ephemeral session storage)
  try {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore storage errors
  }
  return config;
});

// Interceptor to handle common errors (optional)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      try {
        sessionStorage.removeItem("token");
      } catch (e) {
        // ignore
      }
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default API;
