<script setup>
const props = defineProps({
  size: {
    type: String,
    default: 'md',
  },
});

const sizes = {
  sm: 16,
  md: 24,
  lg: 40,
};
</script>

<template>
  <div
    class="spinner"
    :style="{ width: sizes[size] + 'px', height: sizes[size] + 'px' }"
  />
</template>

<style scoped>
.spinner {
  border: 3px solid #ccc;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>