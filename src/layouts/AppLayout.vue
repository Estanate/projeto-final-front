<script setup>
import Navbar from '@/components/Navbar.vue';
</script>

<template>
  <div class="app-layout">
    <Navbar />

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.content {
  padding-bottom: 60px;
}

@media (min-width: 768px) {
  .content {
    padding-bottom: 0;
    padding-left: 80px;
  }
}
</style>