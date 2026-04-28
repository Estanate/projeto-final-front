import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';

export const useFeedStore = defineStore('feed', () => {
  const STORAGE_KEY_BASE = 'instaclone.feed';
  const auth = useAuthStore();

  const postsById = ref({});
  const feedOrder = ref([]);
  const nextCursor = ref(null);
  const isLoading = ref(false);
  const activeUserId = ref(null);
  const hasLoadedStorage = ref(false);

  const feedPosts = computed(() => feedOrder.value.map(id => postsById.value[id]));

  function getStorageKey() {
    return auth.user?.id ? `${STORAGE_KEY_BASE}.${auth.user.id}` : STORAGE_KEY_BASE;
  }

  function ensureUserScope() {
    const currentUserId = auth.user?.id ?? null;
    if (activeUserId.value === currentUserId) return;

    activeUserId.value = currentUserId;
    postsById.value = {};
    feedOrder.value = [];
    nextCursor.value = null;
  }

  function saveFeedToStorage() {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify({
        postsById: postsById.value,
        feedOrder: feedOrder.value,
        nextCursor: nextCursor.value,
      }));
    } catch {  }
  }

  function loadFeedFromStorage() {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const { postsById: p, feedOrder: o, nextCursor: c } = JSON.parse(stored);
        postsById.value = p || {};
        feedOrder.value = o || [];
        nextCursor.value = c || null;
        hasLoadedStorage.value = true;
        return true;
      }
    } catch {  }
    hasLoadedStorage.value = true;
    return false;
  }

  function restoreFeedFromStorage() {
    if (!hasLoadedStorage.value) loadFeedFromStorage();
  }

  function normalizePost(post, previousPost = null) {
    if (!post?.id) return post;

    const normalized = {
      ...post,
      id: post.id,
      image: post.image || post.image_url,
      caption: post.caption || '',
      createdAt: post.created_at || post.createdAt,
      author: post.author || post.user || post.owner || previousPost?.author,
    };

    const rawLikes = post.likes_count ?? post.likesCount ?? (Array.isArray(post.likes) ? post.likes.length : 0);
    normalized.likesCount = Number(rawLikes) || 0;

    const rawIsLiked = post.liked_by_me ?? post.is_liked ?? post.liked ?? post.isLiked;
    normalized.isLiked = rawIsLiked === true || rawIsLiked === 1 || rawIsLiked === '1';

    if (!normalized.isLiked && Array.isArray(post.likes) && auth.user?.id) {
      normalized.isLiked = post.likes.some(l => (l?.id || l) == auth.user.id);
    }

    if (!normalized.isLiked && previousPost?.isLiked) normalized.isLiked = true;

    if (Array.isArray(post.comments)) {
      normalized.comments = post.comments.map(normalizeComment).filter(Boolean);
    } else if (previousPost?.comments) {
      normalized.comments = previousPost.comments;
    }

    return normalized;
  }

  function normalizeComment(comment) {
    if (!comment) return null;
    const raw = comment.data || comment;
    return {
      ...raw,
      id: raw.id,
      body: raw.body || '',
      createdAt: raw.created_at || raw.createdAt,
      author: raw.author || raw.user || raw.owner,
    };
  }

  async function fetchFeed() {
    ensureUserScope();
    isLoading.value = true;
    try {
      const { data } = await api.get('/feed');
      const items = data.data || data.items || [];

      const previous = { ...postsById.value };
      postsById.value = {};
      feedOrder.value = [];

      items.forEach(p => {
        const normalized = normalizePost(p, previous[p.id]);
        postsById.value[normalized.id] = normalized;
        feedOrder.value.push(normalized.id);
      });

      nextCursor.value = data.next_cursor || null;
      saveFeedToStorage();
    } catch (e) {
      console.error('Fetch feed error:', e);
      loadFeedFromStorage();
    } finally {
      isLoading.value = false;
    }
  }

  async function loadMoreFeed() {
    if (!nextCursor.value || isLoading.value) return;
    try {
      const { data } = await api.get(`/feed?cursor=${nextCursor.value}`);
      const items = data.data || data.items || [];

      items.forEach(p => {
        const normalized = normalizePost(p, postsById.value[p.id]);
        postsById.value[normalized.id] = normalized;
        if (!feedOrder.value.includes(normalized.id)) feedOrder.value.push(normalized.id);
      });

      nextCursor.value = data.next_cursor || null;
      saveFeedToStorage();
    } catch (e) {
      console.error('Load more feed error:', e);
    }
  }

  async function toggleLike(postId) {
    restoreFeedFromStorage();
    const post = postsById.value[postId];
    if (!post) return;

    const originalState = post.isLiked;
    const originalCount = post.likesCount;

    post.isLiked = !originalState;
    post.likesCount += post.isLiked ? 1 : -1;
    saveFeedToStorage();

    try {
      if (post.isLiked) await api.post(`/posts/${postId}/like`);
      else await api.delete(`/posts/${postId}/like`);
    } catch (e) {
      post.isLiked = originalState;
      post.likesCount = originalCount;
      saveFeedToStorage();
      throw e;
    }
  }

  async function addComment(postId, body) {
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { body });
      const normalized = normalizeComment(data);
      const post = postsById.value[postId];
      if (post) {
        if (!post.comments) post.comments = [];
        post.comments.unshift(normalized);
        saveFeedToStorage();
      }
      return normalized;
    } catch (e) {
      console.error('Add comment error:', e);
      throw e;
    }
  }

  function setPost(post) {
    const normalized = normalizePost(post, postsById.value[post?.id]);
    if (!normalized?.id) return null;
    postsById.value[normalized.id] = normalized;
    if (!feedOrder.value.includes(normalized.id)) feedOrder.value.unshift(normalized.id);
    saveFeedToStorage();
    return normalized;
  }

  function removePost(postId) {
    delete postsById.value[postId];
    feedOrder.value = feedOrder.value.filter(id => id !== postId);
    saveFeedToStorage();
  }

  return {
    postsById,
    feedOrder,
    nextCursor,
    isLoading,
    fetchFeed,
    loadMoreFeed,
    toggleLike,
    addComment,
    removePost,
    getPostById: id => postsById.value[id],
    setPost,
    feedPosts,
    restoreFeedFromStorage,
  };
});