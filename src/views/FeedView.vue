<script setup>
import { onMounted, ref } from 'vue';
import { useFeedStore } from '@/stores/feed';
import Avatar from '@/components/ui/Avatar.vue';
import { timeAgo } from '@/utils/date';
import { formatCount } from '@/utils/format';

const feed = useFeedStore();

const commentInputs = ref({}); // postId => comment text
const commentErrors = ref({}); // postId => error text

function getPostAuthor(post) {
  return post?.author || post?.user || post?.owner || null;
}

function getPostAuthorUsername(post) {
  return getPostAuthor(post)?.username || post?.username || 'usuario';
}

function getPostAuthorName(post) {
  const author = getPostAuthor(post);
  return author?.name || getPostAuthorUsername(post);
}

function getCommentAuthor(comment) {
  return comment?.author || comment?.user || comment?.owner || null;
}

function getCommentAuthorUsername(comment) {
  return getCommentAuthor(comment)?.username || comment?.username || 'usuario';
}

function getPostLikesCount(post) {
  if (Number.isFinite(Number(post?.likesCount))) return Number(post.likesCount);
  if (Number.isFinite(Number(post?.likes_count))) return Number(post.likes_count);
  if (Number.isFinite(Number(post?.likeCount))) return Number(post.likeCount);
  if (Array.isArray(post?.likes)) return post.likes.length;
  return 0;
}

function getPostIsLiked(post) {
  const value = post?.isLiked ?? post?.is_liked ?? post?.liked;
  return value === true || value === 1 || value === '1';
}

function getPostCreatedAt(post) {
  return post?.createdAt || post?.created_at || post?.posted_at || post?.date || null;
}

onMounted(() => {
  feed.fetchFeed();
});

async function handleLike(postId) {
  await feed.toggleLike(postId);
}

async function handleComment(postId) {
  const body = commentInputs.value[postId]?.trim();
  if (!body) return;

  commentErrors.value[postId] = '';
  try {
    await feed.addComment(postId, body);
    commentInputs.value[postId] = '';
  } catch (error) {
    commentErrors.value[postId] = 'Nao foi possivel salvar o comentario.';
  }
}

function getCommentInput(postId) {
  return commentInputs.value[postId] || '';
}

function setCommentInput(postId, value) {
  commentInputs.value[postId] = value;
}
</script>

<template>
  <div class="feed">
    <div v-if="feed.isLoading" class="text-center py-4">
      Carregando...
    </div>

    <div v-else-if="!feed.feedPosts.length" class="text-center py-4">
      Nenhum post ainda.
    </div>

    <div v-else class="posts">
      <article v-for="post in feed.feedPosts" :key="post.id" class="post-card">
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
            @click="handleLike(post.id)"
            :class="['like-btn', { liked: getPostIsLiked(post) }]"
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
        <div v-if="post.comments?.length" class="comments">
          <div v-for="comment in post.comments.slice(0, 2)" :key="comment.id" class="comment">
            <strong>{{ getCommentAuthorUsername(comment) }}</strong> {{ comment.body }}
          </div>
          <div v-if="post.comments.length > 2" class="more-comments">
            Ver todos os {{ post.comments.length }} comentários
          </div>
        </div>

        <!-- Add Comment -->
        <form @submit.prevent="handleComment(post.id)" class="comment-form">
          <input
            v-model="commentInputs[post.id]"
            type="text"
            placeholder="Adicione um comentário..."
            class="comment-input"
          />
          <button type="submit" :disabled="!getCommentInput(post.id).trim()" class="comment-submit">
            Publicar
          </button>
        </form>
        <small v-if="commentErrors[post.id]" class="comment-error">{{ commentErrors[post.id] }}</small>
      </article>

      <!-- Load More -->
      <div v-if="feed.nextCursor" class="load-more">
        <button @click="feed.loadMoreFeed()" :disabled="feed.isLoading" class="btn btn-primary">
          Carregar mais
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
}

.posts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
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
}

.comment {
  font-size: 14px;
  margin-bottom: 4px;
}

.more-comments {
  font-size: 12px;
  color: var(--color-text-muted);
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

.load-more {
  text-align: center;
  padding: 16px;
}
</style>
