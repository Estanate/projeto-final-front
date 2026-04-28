<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import Spinner from '@/components/ui/Spinner.vue';

const auth = useAuthStore();
const router = useRouter();

const name = ref('');
const username = ref('');
const email = ref('');
const password = ref('');
const password_confirmation = ref('');

const errors = ref({});
const isLoading = ref(false);

function validate() {
  errors.value = {};

  if (!name.value) errors.value.name = 'Name is required';

  if (!username.value) {
    errors.value.username = 'Username is required';
  } else if (!/^[A-Za-z0-9._]+$/.test(username.value)) {
    errors.value.username = 'Invalid username';
  }

  if (!email.value) errors.value.email = 'Email is required';

  if (!password.value || password.value.length < 6) {
    errors.value.password = 'Minimum 6 characters';
  }

  if (password_confirmation.value !== password.value) {
    errors.value.password_confirmation = 'Passwords do not match';
  }

  return Object.keys(errors.value).length === 0;
}

async function handleSubmit() {
  if (!validate()) return;

  try {
    isLoading.value = true;

    await auth.register(
      name.value,
      username.value,
      email.value,
      password.value,
      password_confirmation.value
    );

    router.replace('/feed');
  } catch (error) {

    errors.value = error.response?.data?.errors || {};
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>

  <form @submit.prevent="handleSubmit">
    <input v-model="name" class="form-control mb-2" placeholder="Name" />
    <small class="text-danger">{{ errors.name }}</small>

    <input v-model="username" class="form-control mb-2" placeholder="Username" />
    <small class="text-danger">{{ errors.username }}</small>

    <input v-model="email" type="email" class="form-control mb-2" placeholder="Email" />
    <small class="text-danger">{{ errors.email }}</small>

    <input v-model="password" type="password" class="form-control mb-2" placeholder="Password" />
    <small class="text-danger">{{ errors.password }}</small>

    <input v-model="password_confirmation" type="password" class="form-control mb-2" placeholder="Confirm password" />
    <small class="text-danger">{{ errors.password_confirmation }}</small>

    <button class="btn btn-primary w-100 mt-2" :disabled="isLoading">
      <Spinner v-if="isLoading" size="sm" />
      <span v-else>Register</span>
    </button>

    <p class="mt-3 text-center">
      Already have an account?
      <router-link to="/login">Login</router-link>
    </p>
  </form>
</template>