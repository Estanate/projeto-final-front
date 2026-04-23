<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import Avatar from '@/components/ui/Avatar.vue';

const router = useRouter();
const auth = useAuthStore();

const name = ref(auth.user.name || '');
const username = ref(auth.user.username || '');
const bio = ref(auth.user.bio || '');
const avatarFile = ref(null);
const previewUrl = ref(auth.user.avatar);

const isLoading = ref(false);
const errors = ref({});

const maxNameLength = 255;

const isValid = computed(() => {
  return name.value.trim() && username.value.trim();
});

function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    avatarFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
}

async function handleSubmit() {
  if (!isValid.value) return;

  errors.value = {};
  isLoading.value = true;

  try {
    // Update profile
    const { data } = await api.put('/users/me', {
      name: name.value.trim(),
      username: username.value.trim(),
      bio: bio.value.trim(),
    });

    auth.updateProfile(data);

    // Update avatar if changed
    if (avatarFile.value) {
      const formData = new FormData();
      formData.append('avatar', avatarFile.value);
      const avatarData = await api.post('/users/me/avatar', formData);
      auth.updateProfile({ avatar: avatarData.data.avatar });
    }

    router.push('/perfil');
  } catch (error) {
    errors.value = error.response?.data?.errors || {};
  } finally {
    isLoading.value = false;
  }
}

// Cleanup
import { onUnmounted } from 'vue';
onUnmounted(() => {
  if (previewUrl.value && previewUrl.value !== auth.user.avatar) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <div class="editar-perfil">
    <h2>Editar perfil</h2>

    <form @submit.prevent="handleSubmit">
      <!-- Avatar -->
      <div class="mb-3 text-center">
        <Avatar :src="previewUrl" :alt="name" size="lg" />
        <br>
        <label class="btn btn-outline-primary mt-2">
          Alterar foto
          <input type="file" accept="image/*" @change="handleAvatarChange" hidden />
        </label>
      </div>

      <!-- Name -->
      <div class="mb-3">
        <label class="form-label">Nome</label>
        <input
          v-model="name"
          type="text"
          class="form-control"
          :maxlength="maxNameLength"
          required
        />
        <small class="text-danger">{{ errors.name }}</small>
      </div>

      <!-- Username -->
      <div class="mb-3">
        <label class="form-label">Username</label>
        <input
          v-model="username"
          type="text"
          class="form-control"
          required
        />
        <small class="text-danger">{{ errors.username }}</small>
      </div>

      <!-- Bio -->
      <div class="mb-3">
        <label class="form-label">Bio</label>
        <textarea
          v-model="bio"
          class="form-control"
          rows="3"
        ></textarea>
        <small class="text-danger">{{ errors.bio }}</small>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="!isValid || isLoading"
        class="btn btn-primary w-100"
      >
        Salvar
      </button>
    </form>
  </div>
</template>

<style scoped>
.editar-perfil {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
}
</style>
