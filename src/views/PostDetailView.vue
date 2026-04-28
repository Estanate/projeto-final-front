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
const isDeletingPost = ref(false);

const isPostOwner = computed(() => post.value?.author?.id == auth.user?.id);
const isCommentOwner = (comment) => comment?.author?.id == auth.user?.id;

onMounted(async () => {
  await feed.restoreFeedFromStorage();
  await fetchPost();
});

watch(() => route.params.postId, () => fetchPost());

async function fetchPost() {
  isLoading.value = true;
  errorMessage.value = '';
  const postId = route.params.postId;

  const cached = feed.getPostById(postId);
  if (cached) post.value = cached;

  try {
    const { data } = await api.get(`/posts/${postId}`);
    post.value = feed.setPost(data.data || data);
  } catch (error) {
    if (!post.value) errorMessage.value = 'Não foi possível carregar a publicação.';
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

async function handleLike() {
  if (!post.value?.id) return;
  try {
    await feed.toggleLike(post.value.id);
    const updated = feed.getPostById(post.value.id);
    post.value.isLiked = updated.isLiked;
    post.value.likesCount = updated.likesCount;
  } catch (e) {  }
}

async function handleComment() {
  const body = commentBody.value.trim();
  if (!body) return;

  commentErrorMessage.value = '';
  try {
    const newComment = await feed.addComment(post.value.id, body);
    if (!post.value.comments) post.value.comments = [];
    post.value.comments.unshift(newComment);
    commentBody.value = '';
  } catch (error) {
    commentErrorMessage.value = 'Could not save the comment.';
  }
}

async function handleDeleteComment(commentId) {
  try {
    await api.delete(`/comments/${commentId}`);
    post.value.comments = post.value.comments.filter(c => c.id !== commentId);
  } catch (e) {
    console.error(e);
  }
}

async function handleDeletePost() {
  if (!window.confirm('Excluir esta publicação?')) return;
  isDeletingPost.value = true;
  try {
    await api.delete(`/posts/${post.value.id}`);
    feed.removePost(post.value.id);
    router.push('/feed');
  } catch (e) {
    console.error(e);
  } finally {
    isDeletingPost.value = false;
  }
}
</script>

<template>
  <div v-if="isLoading" class="text-center py-4">Loading...</div>
  <div v-else-if="errorMessage" class="text-center py-4 text-danger">{{ errorMessage }}</div>
  <div v-else-if="post" class="post-detail">
    <header class="post-header">
      <router-link :to="`/profile?user=${post.author?.username}`" class="author">
        <Avatar :src="post.author?.avatar" :alt="post.author?.username" size="sm" />
        <span class="username">{{ post.author?.username }}</span>
      </router-link>
    </header>

    <img :src="post.image" :alt="post.caption" class="post-image" />

    <div class="post-actions">
      <button @click="handleLike" :class="['like-btn', { liked: post.isLiked }]">
        <svg class="like-icon" viewBox="0 0 24 24"><path d="M12 21s-7.43-4.66-10-9.45C.09 8.14 1.79 4 5.73 4A6.33 6.33 0 0 1 12 7.09 6.33 6.33 0 0 1 18.27 4C22.21 4 23.91 8.14 22 11.55 19.43 16.34 12 21 12 21z" /></svg>
      </button>
      <span class="likes-count">{{ formatCount(post.likesCount) }}</span>
    </div>

    <div v-if="post.caption" class="post-caption">
      <strong>{{ post.author?.username }}</strong> {{ post.caption }}
    </div>

    <div class="post-date">{{ timeAgo(post.createdAt) }}</div>

    <div v-if="isPostOwner" class="post-owner-actions">
      <button class="btn btn-outline-danger btn-sm" :disabled="isDeletingPost" @click="handleDeletePost">
        Delete post
      </button>
    </div>

    <div class="comments">
      <div v-for="comment in post.comments" :key="comment.id" class="comment">
        <Avatar :src="comment.author?.avatar" :alt="comment.author?.username" size="sm" />
        <div class="comment-content">
          <strong>{{ comment.author?.username }}</strong> {{ comment.body }}
          <small class="comment-date">{{ timeAgo(comment.createdAt) }}</small>
        </div>
        <button v-if="isCommentOwner(comment)" class="comment-delete" @click="handleDeleteComment(comment.id)">Delete</button>
      </div>
    </div>

    <form @submit.prevent="handleComment" class="comment-form">
      <input v-model="commentBody" type="text" placeholder="Add a comment..." class="comment-input" />
      <button type="submit" :disabled="!commentBody.trim()" class="comment-submit">Post</button>
    </form>
    <small v-if="commentErrorMessage" class="comment-error">{{ commentErrorMessage }}</small>
  </div>
</template>

<style scoped>
.post-detail { max-width: 600px; margin: 0 auto; padding: 16px; }
.post-header { padding: 12px; }
.author { display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit; }
.username { font-weight: 600; }
.post-image { width: 100%; height: auto; display: block; }
.post-actions { padding: 12px; display: flex; align-items: center; gap: 8px; }
.like-btn { background: none; border: none; cursor: pointer; line-height: 0; color: var(--color-text-muted); }
.like-btn.liked { color: #ff4d6d; }
.like-icon { width: 24px; height: 24px; fill: currentColor; }
.likes-count { font-weight: 600; }
.post-caption { padding: 0 12px 8px; font-size: 14px; }
.post-date { padding: 0 12px; font-size: 12px; color: var(--color-text-muted); }
.post-owner-actions { padding: 8px 12px 12px; }
.comments { padding: 0 12px; max-height: 600px; overflow-y: auto; }
.comment { display: flex; gap: 8px; margin-bottom: 12px; align-items: flex-start; }
.comment-content { flex: 1; font-size: 14px; }
.comment-date { display: block; color: var(--color-text-muted); margin-top: 2px; }
.comment-delete { border: none; background: transparent; color: #dc3545; font-size: 12px; cursor: pointer; }
.comment-form { padding: 12px; display: flex; gap: 8px; border-top: 1px solid var(--color-border); }
.comment-input { flex: 1; border: none; outline: none; font-size: 14px; }
.comment-submit { background: none; border: none; color: var(--color-primary); font-weight: 600; cursor: pointer; }
.comment-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.comment-error { display: block; color: #dc3545; padding: 0 12px 12px; font-size: 12px; }
</style>

