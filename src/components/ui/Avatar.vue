<script setup>
import { ref } from 'vue';

const props = defineProps({
  src: String,
  size: {
    type: String,
    default: 'md',
  },
  alt: String,
});

const error = ref(false);

const sizes = {
  sm: 32,
  md: 44,
  lg: 80,
};
</script>

<template>
  <div
    class="avatar"
    :style="{ width: sizes[size] + 'px', height: sizes[size] + 'px' }"
  >
    <img
      v-if="src && !error"
      :src="src"
      :alt="alt"
      @error="error = true"
    />

    <div v-else class="fallback">
      {{ alt?.charAt(0)?.toUpperCase() || '?' }}
    </div>
  </div>
</template>

<style scoped>
.avatar {
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-border);
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-weight: bold;
}
</style>