<script setup>
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}
</script>

<template>
  <nav class="navbar">
    <router-link to="/feed" aria-label="Home">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10.5z" />
      </svg>
      <span class="label">Home</span>
    </router-link>
    <router-link to="/descobrir" aria-label="Buscar">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0-2a9 9 0 1 0 5.65 16l4.17 4.18a1 1 0 0 0 1.41-1.42l-4.17-4.17A9 9 0 0 0 11 2z" />
      </svg>
      <span class="label">Buscar</span>
    </router-link>
    <router-link to="/criar" aria-label="Criar">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11 5a1 1 0 0 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5z" />
      </svg>
      <span class="label">Criar</span>
    </router-link>
    <router-link :to="{ path: '/perfil', query: {} }" aria-label="Perfil">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.58-5-8-5z" />
      </svg>
      <span class="label">Perfil</span>
    </router-link>
    <button type="button" class="nav-button" aria-label="Sair" @click="handleLogout">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5a1 1 0 1 0 0-2H5V5h5a1 1 0 1 0 0-2zm6.29 4.29a1 1 0 0 0-1.41 1.42L17.17 11H9a1 1 0 1 0 0 2h8.17l-2.29 2.29a1 1 0 1 0 1.41 1.42l4-4a1 1 0 0 0 0-1.42z" />
      </svg>
      <span class="label">Sair</span>
    </button>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 60px;

  display: flex;
  justify-content: space-around;
  align-items: center;

  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.nav-button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
}

.icon {
  width: 22px;
  height: 22px;
  fill: currentColor;
}

/* Desktop: sidebar */
@media (min-width: 768px) {
  .navbar {
    top: 0;
    left: 0;
    bottom: auto;
    width: 80px;
    height: 100vh;

    flex-direction: column;
    justify-content: flex-start;
    padding-top: 20px;

    border-top: none;
    border-right: 1px solid var(--color-border);
  }

  .navbar a,
  .navbar .nav-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px;
    width: 100%;
    text-decoration: none;
    color: inherit;
  }

  .label {
    font-size: 12px;
  }
}

/* Mobile */
@media (max-width: 767px) {
  .navbar a,
  .navbar .nav-button {
    font-size: 24px;
    text-decoration: none;
  }

  .label {
    display: none;
  }
}
</style>