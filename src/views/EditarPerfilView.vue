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
const maxUsernameLength = 30;
const usernameRegex = /^[A-Za-z0-9._]+$/;
const maxBioLength = 500;
const maxAvatarSize = 2 * 1024 * 1024;
const allowedAvatarTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const isValid = computed(() => {
  const trimmedName = name.value.trim();
  const trimmedUsername = username.value.trim();
  const trimmedBio = bio.value.trim();
  return Boolean(
    trimmedName &&
    trimmedUsername &&
    trimmedUsername.length <= maxUsernameLength &&
    usernameRegex.test(trimmedUsername) &&
    trimmedBio.length <= maxBioLength
  );
});

function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  errors.value = { ...errors.value, avatar: '' };
  if (!allowedAvatarTypes.includes(file.type)) {
    errors.value = { ...errors.value, avatar: 'Formato inválido. Use JPG, JPEG, PNG ou WEBP.' };
    return;
  }
  if (file.size > maxAvatarSize) {
    errors.value = { ...errors.value, avatar: 'Avatar deve ter no máximo 2MB.' };
    return;
  }

  avatarFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
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
          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" @change="handleAvatarChange" hidden />
        </label>
        <small class="text-danger d-block mt-2">{{ errors.avatar }}</small>
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
          :maxlength="maxUsernameLength"
          required
        />
        <small class="text-danger">{{ errors.username }}</small>
        <small class="text-muted d-block">{{ username.length }}/{{ maxUsernameLength }}</small>
      </div>

      <!-- Bio -->
      <div class="mb-3">
        <label class="form-label">Bio</label>
        <textarea
          v-model="bio"
          class="form-control"
          rows="3"
          :maxlength="maxBioLength"
        ></textarea>
        <small class="text-danger">{{ errors.bio }}</small>
        <small class="text-muted d-block">{{ bio.length }}/{{ maxBioLength }}</small>
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
