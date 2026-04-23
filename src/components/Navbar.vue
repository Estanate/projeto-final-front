<script setup>
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <nav class="navbar">
    <router-link to="/feed" aria-label="Home">
      <span class="icon">🏠</span>
      <span class="label">Home</span>
    </router-link>
    <router-link to="/descobrir" aria-label="Buscar">
      <span class="icon">🔍</span>
      <span class="label">Buscar</span>
    </router-link>
    <router-link to="/criar" aria-label="Criar">
      <span class="icon">➕</span>
      <span class="label">Criar</span>
    </router-link>
    <router-link to="/perfil" aria-label="Perfil">
      <span class="icon">👤</span>
      <span class="label">Perfil</span>
    </router-link>
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

  background: white;
  border-top: 1px solid var(--color-border);
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

  .navbar a {
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
  .navbar a {
    font-size: 24px;
    text-decoration: none;
  }

  .label {
    display: none;
  }
}
</style>