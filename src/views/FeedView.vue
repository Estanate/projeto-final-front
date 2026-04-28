<script setup>
import { onMounted, ref } from 'vue';
import { useFeedStore } from '@/stores/feed';
import { useAuthStore } from '@/stores/auth';
import Avatar from '@/components/ui/Avatar.vue';
import { timeAgo } from '@/utils/date';
import { formatCount } from '@/utils/format';

const feed = useFeedStore();
const auth = useAuthStore();

const commentInputs = ref({});
const commentErrors = ref({});

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
  const value = post?.isLiked ?? post?.is_liked ?? post?.liked ?? post?.liked_by_me;
  return value === true || value === 1 || value === '1';
}

function getPostCreatedAt(post) {
  return post?.createdAt || post?.created_at || post?.posted_at || post?.date || null;
}

function getPostCommentsCount(post) {
  if (Number.isFinite(Number(post?.commentsCount))) return Number(post.commentsCount);
  if (Number.isFinite(Number(post?.comments_count))) return Number(post.comments_count);
  if (Array.isArray(post?.comments)) return post.comments.length;
  return 0;
}

function getPostId(post) {
  return post?.id ?? post?.post_id ?? post?.postId ?? null;
}

async function waitForAuthHydration() {
  if (!auth.isAuthenticated) return;
  if (auth.user?.id) return;

  try {
    await auth.fetchMe();
  } catch (_error) {}
}

onMounted(async () => {
  await waitForAuthHydration();
  feed.restoreFeedFromStorage();
  await feed.fetchFeed();
});

async function handleComment(postId) {
  if (!postId) return;
  const body = commentInputs.value[postId]?.trim();
  if (!body) return;

  commentErrors.value[postId] = '';
  try {
    await feed.addComment(postId, body);
    commentInputs.value[postId] = '';
  } catch (error) {
    commentErrors.value[postId] = 'Could not save the comment.';
  }
}
</script>

<template>
  <div class="feed">
    <div v-if="feed.isLoading" class="text-center py-4">
      Loading...
    </div>

    <div v-else-if="!feed.feedPosts.length" class="text-center py-4">
      No posts yet.
    </div>

    <div v-else class="posts">
      <article v-for="post in feed.feedPosts" :key="getPostId(post)" class="post-card">
        <header v-if="getPostAuthor(post)" class="post-header">
          <router-link :to="`/profile?user=${getPostAuthorUsername(post)}`" class="author">
            <Avatar :src="getPostAuthor(post)?.avatar" :alt="getPostAuthorName(post)" size="sm" />
            <span class="username">{{ getPostAuthorUsername(post) }}</span>
          </router-link>
        </header>

        <img :src="post.image || post.image_url" :alt="post.caption || ''" class="post-image" />

        <div class="post-actions">
          <button
            @click="feed.toggleLike(getPostId(post))"
            :class="['like-btn', { liked: getPostIsLiked(post) }]"
            aria-label="Like"
          >
            <svg class="like-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-7.43-4.66-10-9.45C.09 8.14 1.79 4 5.73 4A6.33 6.33 0 0 1 12 7.09 6.33 6.33 0 0 1 18.27 4C22.21 4 23.91 8.14 22 11.55 19.43 16.34 12 21 12 21z" />
            </svg>
          </button>
          <span class="likes-count">{{ formatCount(getPostLikesCount(post)) }}</span>
        </div>

        <div v-if="post.caption" class="post-caption">
          <strong>{{ getPostAuthorUsername(post) }}</strong> {{ post.caption }}
        </div>

        <div class="post-date">{{ timeAgo(getPostCreatedAt(post)) }}</div>
        <div class="post-comments-count">
          {{ formatCount(getPostCommentsCount(post)) }} comments
        </div>

        <div v-if="post.comments?.length" class="comments">
          <div v-for="comment in post.comments.slice(0, 2)" :key="comment.id" class="comment">
            <strong>{{ getCommentAuthorUsername(comment) }}</strong> {{ comment.body }}
          </div>
          <router-link v-if="post.comments.length > 2" :to="`/posts/${getPostId(post)}`" class="more-comments">
            View all {{ post.comments.length }} comments
          </router-link>
        </div>

        <form @submit.prevent="handleComment(getPostId(post))" class="comment-form">
          <input
            v-model="commentInputs[getPostId(post)]"
            type="text"
            placeholder="Add a comment..."
            class="comment-input"
          />
          <button type="submit" :disabled="!commentInputs[getPostId(post)]?.trim()" class="comment-submit">
            Post
          </button>
        </form>
        <small v-if="commentErrors[getPostId(post)]" class="comment-error">{{ commentErrors[getPostId(post)] }}</small>
      </article>

      <div v-if="feed.nextCursor" class="load-more">
        <button @click="feed.loadMoreFeed()" :disabled="feed.isLoading" class="btn btn-primary">
          Load more
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

.post-comments-count {
  padding: 4px 12px 0;
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
