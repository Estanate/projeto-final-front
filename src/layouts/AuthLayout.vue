<script setup>
</script>

<template>
  <div class="auth-layout">
    <div class="auth-container">
      <h1 class="logo">InstaClone</h1>

      <router-view />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
}

.auth-container {
  width: 100%;
  max-width: 350px;
  padding: 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.logo {
  text-align: center;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 24px;

  background: linear-gradient(
    45deg,
    var(--color-gradient-start),
    var(--color-gradient-mid),
    var(--color-gradient-end)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>