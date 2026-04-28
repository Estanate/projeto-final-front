<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import Avatar from '@/components/ui/Avatar.vue';

const router = useRouter();
const auth = useAuthStore();

const form = ref({
  name: auth.user.name || '',
  username: auth.user.username || '',
  bio: auth.user.bio || '',
});

const avatarFile = ref(null);
const previewUrl = ref(auth.user.avatar);
const isLoading = ref(false);
const errors = ref({});

const CONFIG = {
  maxUsername: 30,
  maxBio: 500,
  maxAvatar: 2 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  usernameRegex: /^[A-Za-z0-9._]+$/,
};

const isValid = computed(() => {
  const { name, username, bio } = form.value;
  return Boolean(
    name.trim() &&
    username.trim() &&
    username.length <= CONFIG.maxUsername &&
    CONFIG.usernameRegex.test(username) &&
    bio.length <= CONFIG.maxBio &&
    !errors.value.avatar
  );
});

function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (previewUrl.value && previewUrl.value !== auth.user.avatar) {
    URL.revokeObjectURL(previewUrl.value);
  }

  delete errors.value.avatar;

  if (!CONFIG.allowedTypes.includes(file.type)) {
    errors.value.avatar = 'Formato inválido. Use JPG, JPEG, PNG ou WEBP.';
    return;
  }
  if (file.size > CONFIG.maxAvatar) {
    errors.value.avatar = 'Avatar deve ter no máximo 2MB.';
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
    if (avatarFile.value) {
      const formData = new FormData();
      formData.append('avatar', avatarFile.value);
      const { data: avatarData } = await api.post('/users/me/avatar', formData);
      auth.updateProfile(avatarData);
      avatarFile.value = null;
    }

    const { data } = await api.put('/users/me', {
      name: form.value.name.trim(),
      username: form.value.username.trim(),
      bio: form.value.bio.trim(),
    });

    auth.updateProfile(data);
    router.push('/profile');
  } catch (error) {
    errors.value = error.response?.data?.errors || { general: 'Error saving.' };
  } finally {
    isLoading.value = false;
  }
}

onUnmounted(() => {
  if (previewUrl.value && previewUrl.value !== auth.user.avatar) {
    URL.revokeObjectURL(previewUrl.value);
  }
});

const getError = (field) => Array.isArray(errors.value[field]) ? errors.value[field][0] : errors.value[field];
</script>

<template>
  <div class="edit-profile">
    <h2>Edit Profile</h2>

    <form @submit.prevent="handleSubmit">
      <div v-if="errors.general" class="alert alert-danger">{{ errors.general }}</div>

      <div class="mb-3 text-center">
        <Avatar :src="previewUrl" :alt="form.name" size="lg" />
        <br>
        <label class="btn btn-outline-primary mt-2">
          Change photo
          <input type="file" @change="handleAvatarChange" hidden />
        </label>
        <small class="text-danger d-block mt-2">{{ getError('avatar') }}</small>
      </div>

      <div class="mb-3">
        <label class="form-label">Name</label>
        <input v-model="form.name" type="text" class="form-control" required />
        <small class="text-danger">{{ getError('name') }}</small>
      </div>

      <div class="mb-3">
        <label class="form-label">Username</label>
        <input v-model="form.username" type="text" class="form-control" :maxlength="CONFIG.maxUsername" required />
        <small class="text-danger">{{ getError('username') }}</small>
        <small class="text-muted d-block">{{ form.username.length }}/{{ CONFIG.maxUsername }}</small>
      </div>

      <div class="mb-3">
        <label class="form-label">Bio</label>
        <textarea v-model="form.bio" class="form-control" rows="3" :maxlength="CONFIG.maxBio"></textarea>
        <small class="text-danger">{{ getError('bio') }}</small>
        <small class="text-muted d-block">{{ form.bio.length }}/{{ CONFIG.maxBio }}</small>
      </div>

      <button type="submit" :disabled="!isValid || isLoading" class="btn btn-primary w-100">
        {{ isLoading ? 'Saving...' : 'Save' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.edit-profile {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
}
</style>