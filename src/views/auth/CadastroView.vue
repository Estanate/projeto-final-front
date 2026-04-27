<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import Spinner from '@/components/ui/Spinner.vue';

const auth = useAuthStore();
const router = useRouter();

//definição dos campos do formulário e estados de erro/carregamento
const name = ref('');
const username = ref('');
const email = ref('');
const password = ref('');
const password_confirmation = ref('');

const errors = ref({});
const isLoading = ref(false);

//função de validação do formulario
function validate() {
  errors.value = {};

  //se os campos estiverem vazios adiciona mensagens de erro ao objeto errors
  if (!name.value) errors.value.name = 'Nome obrigatório';

  if (!username.value) {
    errors.value.username = 'Username obrigatório';
  } else if (!/^[A-Za-z0-9._]+$/.test(username.value)) {
    errors.value.username = 'Username inválido';
  }

  if (!email.value) errors.value.email = 'Email obrigatório';

  if (!password.value || password.value.length < 6) {
    errors.value.password = 'Mínimo 6 caracteres';
  }

  if (password_confirmation.value !== password.value) {
    errors.value.password_confirmation = 'Senhas não conferem';
  }

  return Object.keys(errors.value).length === 0;
}

//função de envio do formulário
async function handleSubmit() {
  if (!validate()) return;

  // tenta registrar o usuário no backend usando a autenticação
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
    // erros vindos do backend
    errors.value = error.response?.data?.errors || {};
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  //formulario para a criação de uma nova conta, atribuindo o valor do formulario a sua respectiva const com o v-model
  <form @submit.prevent="handleSubmit">
    <input v-model="name" class="form-control mb-2" placeholder="Nome" />
    <small class="text-danger">{{ errors.name }}</small>

    <input v-model="username" class="form-control mb-2" placeholder="Username" />
    <small class="text-danger">{{ errors.username }}</small>

    <input v-model="email" type="email" class="form-control mb-2" placeholder="Email" />
    <small class="text-danger">{{ errors.email }}</small>

    <input v-model="password" type="password" class="form-control mb-2" placeholder="Senha" />
    <small class="text-danger">{{ errors.password }}</small>

    <input v-model="password_confirmation" type="password" class="form-control mb-2" placeholder="Confirmar senha" />
    <small class="text-danger">{{ errors.password_confirmation }}</small>

    <button class="btn btn-primary w-100 mt-2" :disabled="isLoading">
      <Spinner v-if="isLoading" size="sm" />
      <span v-else>Cadastrar</span>
    </button>

     //redirecionamento a tela de login caso o usuario tenha se enganado
    <p class="mt-3 text-center">
      Já tem conta?
      <router-link to="/login">Entrar</router-link>
    </p>
  </form>
</template>