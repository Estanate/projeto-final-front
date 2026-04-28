<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import Spinner from '@/components/ui/Spinner.vue';

const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

async function handleSubmit() {
  errorMessage.value = '';

  if (!email.value || !password.value) {
    errorMessage.value = 'Fill in all fields';
    return;
  }

  try {
    isLoading.value = true;

    await auth.login(email.value, password.value);

    router.replace('/feed');
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || 'Error logging in';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="mb-3">
      <label class="visually-hidden">Email</label>
      <input
        v-model="email"
        type="email"
        class="form-control"
        placeholder="Email"
      />
    </div>

    <div class="mb-3">
      <label class="visually-hidden">Password</label>
      <input
        v-model="password"
        type="password"
        class="form-control"
        placeholder="Password"
      />
    </div>

    <button class="btn btn-primary w-100" :disabled="isLoading">
      <Spinner v-if="isLoading" size="sm" />
      <span v-else>Login</span>
    </button>

    <p v-if="errorMessage" class="text-danger mt-2">
      {{ errorMessage }}
    </p>

    <p class="mt-3 text-center">
      Don't have an account?
      <router-link to="/register">Sign up</router-link>
    </p>
  </form>
</template>