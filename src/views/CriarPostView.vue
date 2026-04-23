<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import Spinner from '@/components/ui/Spinner.vue';

const router = useRouter();

const imageFile = ref(null);
const previewUrl = ref(null);
const caption = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const maxCaptionLength = 2200;
const maxFileSize = 5 * 1024 * 1024; // 5MB

const isValid = computed(() => {
  return imageFile.value && caption.value.trim().length > 0 && caption.value.length <= maxCaptionLength;
});

watch(imageFile, (newFile) => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  if (newFile) {
    previewUrl.value = URL.createObjectURL(newFile);
  } else {
    previewUrl.value = null;
  }
});

function handleFileChange(event) {
  const file = event.target.files[0];
  errorMessage.value = '';

  if (!file) {
    imageFile.value = null;
    return;
  }

  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Apenas imagens são permitidas';
    return;
  }

  if (file.size > maxFileSize) {
    errorMessage.value = 'Imagem deve ter no máximo 5MB';
    return;
  }

  imageFile.value = file;
}

async function handleSubmit() {
  if (!isValid.value) return;

  const formData = new FormData();
  formData.append('image', imageFile.value);
  formData.append('caption', caption.value.trim());

  try {
    isLoading.value = true;
    await api.post('/posts', formData);
    router.push('/feed');
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Erro ao criar post';
  } finally {
    isLoading.value = false;
  }
}

// Cleanup on unmount
import { onUnmounted } from 'vue';
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <div class="criar-post">
    <h2>Criar novo post</h2>

    <form @submit.prevent="handleSubmit">
      <!-- File Input -->
      <div class="mb-3">
        <label class="form-label">Imagem</label>
        <input
          type="file"
          accept="image/*"
          @change="handleFileChange"
          class="form-control"
          required
        />
      </div>

      <!-- Preview -->
      <div v-if="previewUrl" class="preview">
        <img :src="previewUrl" alt="Preview" />
      </div>

      <!-- Caption -->
      <div class="mb-3">
        <label class="form-label">Legenda</label>
        <textarea
          v-model="caption"
          class="form-control"
          rows="3"
          :maxlength="maxCaptionLength"
          placeholder="Escreva uma legenda..."
        ></textarea>
        <small class="text-muted">
          {{ caption.length }}/{{ maxCaptionLength }}
        </small>
      </div>

      <!-- Error -->
      <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="!isValid || isLoading"
        class="btn btn-primary w-100"
      >
        <Spinner v-if="isLoading" size="sm" />
        <span v-else>Publicar</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.criar-post {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
}

.preview {
  margin-bottom: 16px;
  text-align: center;
}

.preview img {
  max-width: 100%;
  max-height: 400px;
  border-radius: var(--radius-md);
}
</style>