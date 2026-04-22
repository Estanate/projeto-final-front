import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // NUNCA hardcoded
});

// Interceptor de request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('instaclone.token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`; 
    // Injeta token automaticamente em TODAS as requests autenticadas
  }

  return config;
});

// Interceptor de response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token inválido/expirado → força logout global
      localStorage.removeItem('instaclone.token');
      window.location.href = '/login'; 
      // Redirecionamento direto evita inconsistência de estado
    }

    return Promise.reject(error);
  }
);

export default api;