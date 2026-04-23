<script setup>
import { onMounted, ref, watch } from 'vue';
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
const errorMessage = ref('');
const commentErrorMessage = ref('');

function getPostAuthor(postData) {
  return postData?.author || postData?.user || postData?.owner || null;
}

function getPostAuthorUsername(postData) {
  return getPostAuthor(postData)?.username || postData?.username || 'usuario';
}

function getPostAuthorName(postData) {
  const author = getPostAuthor(postData);
  return author?.name || getPostAuthorUsername(postData);
}

function getCommentAuthor(comment) {
  return comment?.author || comment?.user || comment?.owner || null;
}

function getCommentAuthorUsername(comment) {
  return getCommentAuthor(comment)?.username || comment?.username || 'usuario';
}

function getCommentAuthorName(comment) {
  const author = getCommentAuthor(comment);
  return author?.name || getCommentAuthorUsername(comment);
}

function getPostLikesCount(postData) {
  if (Number.isFinite(Number(postData?.likesCount))) return Number(postData.likesCount);
  if (Number.isFinite(Number(postData?.likes_count))) return Number(postData.likes_count);
  if (Number.isFinite(Number(postData?.likeCount))) return Number(postData.likeCount);
  if (Array.isArray(postData?.likes)) return postData.likes.length;
  return 0;
}

function getPostCreatedAt(postData) {
  return postData?.createdAt || postData?.created_at || postData?.posted_at || postData?.date || null;
}

onMounted(async () => {
  await fetchPost();
});

watch(
  () => route.params.postId,
  async () => {
    await fetchPost();
  }
);

async function fetchPost() {
  isLoading.value = true;
  errorMessage.value = '';

  const postId = route.params.postId;
  const cachedPost = feed.getPostById(postId);
  if (cachedPost) {
    post.value = cachedPost;
  }

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 8000);
    });

    const response = await Promise.race([
      api.get(`/posts/${postId}`),
      timeoutPromise,
    ]);

    const payload = response.data?.data ?? response.data;
    post.value = payload;
  } catch (error) {
    console.error(error);

    if (!post.value) {
      errorMessage.value = 'Nao foi possivel carregar esta publicacao.';
    }
  } finally {
    isLoading.value = false;
  }
}

async function handleLike() {
  if (!post.value?.id) return;
  await feed.toggleLike(post.value.id);
  // Update local
  post.value.isLiked = !post.value.isLiked;
  const currentLikes = getPostLikesCount(post.value);
  post.value.likesCount = currentLikes + (post.value.isLiked ? 1 : -1);
}

async function handleComment() {
  if (!commentBody.value.trim()) return;

  commentErrorMessage.value = '';
  try {
    await api.post(`/posts/${post.value.id}/comments`, {
      body: commentBody.value.trim(),
    });
    commentBody.value = '';
    await fetchPost();
  } catch (error) {
    console.error(error);
    commentErrorMessage.value = 'Nao foi possivel salvar o comentario.';
  }
}
</script>

<template>
  <div v-if="isLoading" class="text-center py-4">
    Carregando...
  </div>

  <div v-else-if="errorMessage" class="text-center py-4 text-danger">
    {{ errorMessage }}
  </div>

  <div v-else-if="post" class="post-detail">
    <!-- Header -->
    <header v-if="getPostAuthor(post)" class="post-header">
      <router-link :to="`/perfil?user=${getPostAuthorUsername(post)}`" class="author">
        <Avatar :src="getPostAuthor(post)?.avatar" :alt="getPostAuthorName(post)" size="sm" />
        <span class="username">{{ getPostAuthorUsername(post) }}</span>
      </router-link>
    </header>

    <!-- Image -->
    <img :src="post.image || post.image_url" :alt="post.caption || ''" class="post-image" />

    <!-- Actions -->
    <div class="post-actions">
      <button
        @click="handleLike"
        :class="['like-btn', { liked: post.isLiked }]"
        aria-label="Curtir"
      >
        ❤️
      </button>
      <span class="likes-count">{{ formatCount(getPostLikesCount(post)) }}</span>
    </div>

    <!-- Caption -->
    <div v-if="post.caption" class="post-caption">
      <strong>{{ getPostAuthorUsername(post) }}</strong> {{ post.caption }}
    </div>

    <!-- Date -->
    <div class="post-date">{{ timeAgo(getPostCreatedAt(post)) }}</div>

    <!-- Comments -->
    <div class="comments">
      <div v-for="comment in (post.comments || [])" :key="comment.id" class="comment">
        <Avatar :src="getCommentAuthor(comment)?.avatar" :alt="getCommentAuthorName(comment)" size="sm" />
        <div class="comment-content">
          <strong>{{ getCommentAuthorUsername(comment) }}</strong> {{ comment.body }}
          <small class="comment-date">{{ timeAgo(comment.createdAt || comment.created_at) }}</small>
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
    <small v-if="commentErrorMessage" class="comment-error">{{ commentErrorMessage }}</small>
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

.comment-error {
  display: block;
  color: #dc3545;
  padding: 0 12px 12px;
  font-size: 12px;
}
</style>
