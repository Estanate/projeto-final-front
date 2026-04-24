<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useFeedStore } from '@/stores/feed';
import api from '@/services/api';
import Avatar from '@/components/ui/Avatar.vue';
import { timeAgo } from '@/utils/date';
import { formatCount } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const feed = useFeedStore();

const post = ref(null);
const isLoading = ref(true);
const commentBody = ref('');
const errorMessage = ref('');
const commentErrorMessage = ref('');
const commentsPage = ref(1);
const hasMoreComments = ref(false);
const isLoadingMoreComments = ref(false);
const isDeletingPost = ref(false);

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

const isPostOwner = computed(() => {
  const postAuthor = getPostAuthor(post.value);
  return Boolean(postAuthor?.id && auth.user?.id && Number(postAuthor.id) === Number(auth.user.id));
});

function isCommentOwner(comment) {
  const author = getCommentAuthor(comment);
  return Boolean(author?.id && auth.user?.id && Number(author.id) === Number(auth.user.id));
}

function extractComments(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.comments)) return payload.comments;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function extractMeta(payload) {
  if (!payload || typeof payload !== 'object') return null;
  return payload.meta || payload.pagination || null;
}

function normalizeComment(comment) {
  if (!comment) return null;
  return {
    ...comment,
    id: comment.id ?? comment.comment_id ?? null,
    body: comment.body ?? comment.content ?? '',
    createdAt: comment.createdAt ?? comment.created_at ?? null,
  };
}

function mergeComments(current, incoming) {
  const byKey = new Map();
  // Adiciona comentários existentes primeiro
  (current || []).forEach((comment) => {
    const normalized = normalizeComment(comment);
    if (!normalized || !normalized.id) return;
    byKey.set(`id:${normalized.id}`, normalized);
  });
  // Adiciona comentários novos
  (incoming || []).forEach((comment) => {
    const normalized = normalizeComment(comment);
    if (!normalized || !normalized.id) return;
    byKey.set(`id:${normalized.id}`, normalized);
  });
  return Array.from(byKey.values());
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
  commentsPage.value = 1;
  hasMoreComments.value = false;

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
    await loadCommentsPage(1, true);
  } catch (error) {
    console.error(error);

    if (!post.value) {
      errorMessage.value = 'Nao foi possivel carregar esta publicacao.';
    }
  } finally {
    isLoading.value = false;
  }
}

async function loadCommentsPage(page = 1, replace = false) {
  const postId = route.params.postId;
  const commentsResponse = await api.get(`/posts/${postId}/comments?page=${page}`);
  const comments = extractComments(commentsResponse.data).map(normalizeComment).filter(Boolean);
  const meta = extractMeta(commentsResponse.data);

  if (!post.value) return;
  
  if (replace) {
    // Primeira vez que carrega comentários - substitui tudo
    post.value.comments = comments;
  } else {
    // Carregando mais comentários - adiciona aos existentes
    post.value.comments = [...(post.value.comments || []), ...comments];
  }

  // Atualiza flag de mais comentários baseado na paginação
  if (meta?.current_page && meta?.last_page) {
    hasMoreComments.value = Number(meta.current_page) < Number(meta.last_page);
  } else if (meta?.next_page_url) {
    hasMoreComments.value = Boolean(meta.next_page_url);
  } else {
    // Se recebeu comentários e está na primeira página, assume que há mais se recebeu a quantidade máxima
    hasMoreComments.value = page === 1 && comments.length > 0;
  }
}

async function handleLoadMoreComments() {
  if (isLoadingMoreComments.value || !hasMoreComments.value) return;
  isLoadingMoreComments.value = true;
  try {
    commentsPage.value += 1;
    await loadCommentsPage(commentsPage.value, false);
  } catch (_error) {
    commentsPage.value -= 1;
  } finally {
    isLoadingMoreComments.value = false;
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
    await loadCommentsPage(1, true);
  } catch (error) {
    console.error(error);
    commentErrorMessage.value = 'Nao foi possivel salvar o comentario.';
  }
}

async function handleDeleteComment(commentId) {
  if (!commentId) return;

  try {
    await api.delete(`/comments/${commentId}`);
    post.value.comments = (post.value.comments || []).filter((comment) => comment.id !== commentId);
  } catch (error) {
    console.error(error);
  }
}

async function handleDeletePost() {
  if (!post.value?.id || isDeletingPost.value) return;
  const confirmed = window.confirm('Tem certeza que deseja excluir esta publicacao?');
  if (!confirmed) return;

  isDeletingPost.value = true;
  try {
    await api.delete(`/posts/${post.value.id}`);
    feed.removePost(post.value.id);
    router.push('/feed');
  } catch (error) {
    console.error(error);
  } finally {
    isDeletingPost.value = false;
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
        <svg class="like-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s-7.43-4.66-10-9.45C.09 8.14 1.79 4 5.73 4A6.33 6.33 0 0 1 12 7.09 6.33 6.33 0 0 1 18.27 4C22.21 4 23.91 8.14 22 11.55 19.43 16.34 12 21 12 21z" />
        </svg>
      </button>
      <span class="likes-count">{{ formatCount(getPostLikesCount(post)) }}</span>
    </div>

    <!-- Caption -->
    <div v-if="post.caption" class="post-caption">
      <strong>{{ getPostAuthorUsername(post) }}</strong> {{ post.caption }}
    </div>

    <!-- Date -->
    <div class="post-date">{{ timeAgo(getPostCreatedAt(post)) }}</div>
    <div v-if="isPostOwner" class="post-owner-actions">
      <button class="btn btn-outline-danger btn-sm" :disabled="isDeletingPost" @click="handleDeletePost">
        Excluir publicação
      </button>
    </div>

    <!-- Comments -->
    <div class="comments">
      <div v-for="comment in (post.comments || [])" :key="comment.id" class="comment">
        <Avatar :src="getCommentAuthor(comment)?.avatar" :alt="getCommentAuthorName(comment)" size="sm" />
        <div class="comment-content">
          <strong>{{ getCommentAuthorUsername(comment) }}</strong> {{ comment.body }}
          <small class="comment-date">{{ timeAgo(comment.createdAt || comment.created_at) }}</small>
        </div>
        <button
          v-if="isCommentOwner(comment)"
          class="comment-delete"
          @click="handleDeleteComment(comment.id)"
        >
          Excluir
        </button>
      </div>
      <button
        v-if="hasMoreComments"
        class="btn btn-outline-primary btn-sm w-100"
        :disabled="isLoadingMoreComments"
        @click="handleLoadMoreComments"
      >
        {{ isLoadingMoreComments ? 'Carregando...' : 'Carregar mais comentários' }}
      </button>
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
  cursor: pointer;
  line-height: 0;
  color: var(--color-text-muted);
}

.like-btn.liked {
  color: #ff4d6d;
}

.like-icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
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

.post-owner-actions {
  padding: 8px 12px 12px;
}

.comments {
  padding: 0 12px;
  max-height: 600px;
  overflow-y: auto;
}

.comment {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: flex-start;
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

.comment-delete {
  border: none;
  background: transparent;
  color: #dc3545;
  font-size: 12px;
  cursor: pointer;
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
