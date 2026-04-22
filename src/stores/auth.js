import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  // 🔹 STATE
  const user = ref(null);
  const token = ref(null);

  // 🔹 GETTERS
  const isAuthenticated = computed(() => !!token.value);
  // 👉 true se existir token

  // 🔹 ACTIONS

  async function init() {
    const savedToken = localStorage.getItem('instaclone.token');

    if (savedToken) {
      token.value = savedToken;

      try {
        await fetchMe();
      } catch (error) {
        // 👉 Se token inválido, limpa tudo
        logout();
      }
    }
  }

  async function login(email, password) {
    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
      });

      token.value = data.access_token;
      user.value = data.user;

      localStorage.setItem('instaclone.token', data.access_token);
      // 👉 Persistência obrigatória
    } catch (error) {
      throw error;
      // 👉 Deixa a view tratar o erro (mensagem da API)
    }
  }

  async function register(name, username, email, password, password_confirmation) {
    try {
      const { data } = await api.post('/auth/register', {
        name,
        username,
        email,
        password,
        password_confirmation,
      });

      token.value = data.access_token;
      user.value = data.user;

      localStorage.setItem('instaclone.token', data.access_token);
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // 👉 Ignora erro (token pode já estar inválido)
    } finally {
      localStorage.removeItem('instaclone.token');
      token.value = null;
      user.value = null;
    }
  }

  async function fetchMe() {
    try {
      const { data } = await api.get('/auth/me');
      user.value = data;
    } catch (error) {
      await logout();
      throw error;
    }
  }

  function updateProfile(data) {
    user.value = {
      ...user.value,
      ...data,
    };
    // 👉 Atualiza local sem precisar refazer fetch
  }

  return {
    user,
    token,
    isAuthenticated,
    init,
    login,
    register,
    logout,
    fetchMe,
    updateProfile,
  };
});