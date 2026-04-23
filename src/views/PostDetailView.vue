<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useFeedStore } from '@/stores/feed';
import api from '@/services/api';
import Avatar from '@/components/ui/Avatar.vue';
import { timeAgo } from '@/utils/date';
import { formatCount } from '@/utils/format';

const route = useRoute();
const feed = useFeedStore();

const post = ref(null);
const isLoading = ref(true);
const commentBody = ref('');

onMounted(async () => {
  await fetchPost();
});

async function fetchPost() {
  isLoading.value = true;
  try {
    const { data } = await api.get(`/posts/${route.params.postId}`);
    post.value = data;
  } catch (error) {
    console.error(error);
    // TODO: handle not found
  } finally {
    isLoading.value = false;
  }
}

async function handleLike() {
  await feed.toggleLike(post.value.id);
  // Update local
  post.value.isLiked = !post.value.isLiked;
  post.value.likesCount += post.value.isLiked ? 1 : -1;
}

async function handleComment() {
  if (!commentBody.value.trim()) return;

  try {
    const { data } = await api.post(`/posts/${post.value.id}/comments`, {
      body: commentBody.value.trim(),
    });

    post.value.comments.push(data);
    commentBody.value = '';
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div v-if="isLoading" class="text-center py-4">
    Carregando...
  </div>

  <div v-else-if="post" class="post-detail">
    <!-- Header -->
    <header class="post-header">
      <router-link :to="`/perfil?user=${post.author.username}`" class="author">
        <Avatar :src="post.author.avatar" :alt="post.author.name" size="sm" />
        <span class="username">{{ post.author.username }}</span>
      </router-link>
    </header>

    <!-- Image -->
    <img :src="post.image" :alt="post.caption" class="post-image" />

    <!-- Actions -->
    <div class="post-actions">
      <button
        @click="handleLike"
        :class="['like-btn', { liked: post.isLiked }]"
        aria-label="Curtir"
      >
        ❤️
      </button>
      <span class="likes-count">{{ formatCount(post.likesCount) }}</span>
    </div>

    <!-- Caption -->
    <div v-if="post.caption" class="post-caption">
      <strong>{{ post.author.username }}</strong> {{ post.caption }}
    </div>

    <!-- Date -->
    <div class="post-date">{{ timeAgo(post.createdAt) }}</div>

    <!-- Comments -->
    <div class="comments">
      <div v-for="comment in post.comments" :key="comment.id" class="comment">
        <Avatar :src="comment.author.avatar" :alt="comment.author.name" size="sm" />
        <div class="comment-content">
          <strong>{{ comment.author.username }}</strong> {{ comment.body }}
          <small class="comment-date">{{ timeAgo(comment.createdAt) }}</small>
        </div>
      </div>
    </div>

    <!-- Add Comment -->
    <form @submit.prevent="handleComment" class="comment-form">
      <input
        v-model="commentBody"
        type="text"
        placeholder="Adicione um comentário..."
        class="comment-input"
      />
      <button type="submit" :disabled="!commentBody.trim()" class="comment-submit">
        Publicar
      </button>
    </form>
  </div>
</template>

<style scoped>
.post-detail {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
}

.post-header {
  padding: 12px;
}

.author {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: inherit;
}

.username {
  font-weight: 600;
}

.post-image {
  width: 100%;
  height: auto;
  display: block;
}

.post-actions {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.like-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.like-btn.liked {
  color: red;
}

.likes-count {
  font-weight: 600;
}

.post-caption {
  padding: 0 12px 8px;
  font-size: 14px;
}

.post-date {
  padding: 0 12px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.comments {
  padding: 0 12px;
  max-height: 400px;
  overflow-y: auto;
}

.comment {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.comment-content {
  flex: 1;
  font-size: 14px;
}

.comment-date {
  display: block;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.comment-form {
  padding: 12px;
  display: flex;
  gap: 8px;
  border-top: 1px solid var(--color-border);
}

.comment-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
}

.comment-submit {
  background: none;
  border: none;
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
}

.comment-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>