import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

const TOKEN_KEY = 'instaclone.token';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(null);

  const isAuthenticated = computed(() => !!token.value);

  function setAuth(userData, userToken) {
    user.value = userData;
    token.value = userToken;
    localStorage.setItem(TOKEN_KEY, userToken);
  }

  async function init() {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) return;

    token.value = savedToken;
    try {
      await fetchMe();
    } catch {
      logout();
    }
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    setAuth(data.user, data.access_token);
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    setAuth(data.user, data.access_token);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {

    } finally {
      localStorage.removeItem(TOKEN_KEY);
      token.value = null;
      user.value = null;
    }
  }

  async function fetchMe() {
    try {
      const { data } = await api.get('/auth/me');
      user.value = data;
    } catch (error) {
      logout();
      throw error;
    }
  }

  function updateProfile(data) {
    user.value = { ...user.value, ...data };
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