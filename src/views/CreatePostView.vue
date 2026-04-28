<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useFeedStore } from '@/stores/feed';
import Spinner from '@/components/ui/Spinner.vue';

const router = useRouter();
const feed = useFeedStore();

const imageFile = ref(null);
const previewUrl = ref(null);
const caption = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const maxCaptionLength = 2200;
const maxFileSize = 5 * 1024 * 1024;
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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

  if (!allowedImageTypes.includes(file.type)) {
    errorMessage.value = 'Invalid format. Use JPG, JPEG, PNG or WEBP.';
    return;
  }

  if (file.size > maxFileSize) {
    errorMessage.value = 'Image must be at most 5MB';
    return;
  }

  imageFile.value = file;
}

async function handleSubmit() {
  if (!isValid.value) return;

  const formData = new FormData();
  formData.append('image', imageFile.value);
  formData.append('file', imageFile.value);
  formData.append('caption', caption.value.trim());
  formData.append('text', caption.value.trim());

  try {
    isLoading.value = true;
    await feed.createPost(formData);
    router.push('/feed');
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Error creating post';
  } finally {
    isLoading.value = false;
  }
}

import { onUnmounted } from 'vue';
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <div class="create-post">
    <h2>Create new post</h2>

    <form @submit.prevent="handleSubmit">

      <div class="mb-3">
        <label class="form-label">Image</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          @change="handleFileChange"
          class="form-control"
          required
        />
      </div>

      <div v-if="previewUrl" class="preview">
        <img :src="previewUrl" alt="Preview" />
      </div>

      <div class="mb-3">
        <label class="form-label">Caption</label>
        <textarea
          v-model="caption"
          class="form-control"
          rows="3"
          :maxlength="maxCaptionLength"
          placeholder="Write a caption..."
        ></textarea>
        <small class="text-muted">
          {{ caption.length }}/{{ maxCaptionLength }}
        </small>
      </div>

      <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>

      <button
        type="submit"
        :disabled="!isValid || isLoading"
        class="btn btn-primary w-100"
      >
        <Spinner v-if="isLoading" size="sm" />
        <span v-else>Post</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.create-post {
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
