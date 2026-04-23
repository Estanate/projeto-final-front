<script setup>
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <div class="notfound">
    <h1>Página não encontrada</h1>

    <router-link
      v-if="auth.isAuthenticated"
      to="/feed"
    >
      Voltar ao feed
    </router-link>

    <router-link
      v-else
      to="/login"
    >
      Fazer login
    </router-link>
  </div>
</template>

<style scoped>
.notfound {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
}
</style>