<script setup>
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <nav class="navbar">
    <router-link to="/feed" aria-label="Home">🏠</router-link>
    <router-link to="/descobrir" aria-label="Buscar">🔍</router-link>
    <router-link to="/criar" aria-label="Criar">➕</router-link>
    <router-link to="/perfil" aria-label="Perfil">
      👤
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

.navbar a {
  font-size: 24px;
  text-decoration: none;
}
</style>