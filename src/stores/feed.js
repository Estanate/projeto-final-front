import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const useFeedStore = defineStore('feed', () => {
  // 🔹 STATE
  const postsById = ref({});
  const feedOrder = ref([]);
  const nextCursor = ref(null);
  const isLoading = ref(false);

  // 🔹 GETTERS
  const feedPosts = computed(() =>
    feedOrder.value.map((id) => postsById.value[id])
  );

  function normalizePost(post) {
    if (!post?.id) return post;

    const normalized = { ...post };
    const likesCount = Number(
      normalized.likesCount ??
      normalized.likes_count ??
      normalized.likeCount ??
      (Array.isArray(normalized.likes) ? normalized.likes.length : 0)
    );
    normalized.likesCount = Number.isFinite(likesCount) ? likesCount : 0;

    const rawIsLiked =
      normalized.isLiked ??
      normalized.is_liked ??
      normalized.liked;
    normalized.isLiked = rawIsLiked === true || rawIsLiked === 1 || rawIsLiked === '1';

    return normalized;
  }

  function getPostById(id) {
    return postsById.value[id];
  }

  // 🔹 ACTIONS

  async function fetchFeed() {
    isLoading.value = true;

    try {
      const { data } = await api.get('/feed');
      const items = Array.isArray(data?.data) ? data.data : [];

      postsById.value = {};
      feedOrder.value = [];

      items.forEach((post) => {
        const normalizedPost = normalizePost(post);
        if (!normalizedPost?.id) return;
        postsById.value[normalizedPost.id] = normalizedPost;
        feedOrder.value.push(normalizedPost.id);
      });

      nextCursor.value = data?.next_cursor || null;
    } catch (error) {
      console.error(error);
      postsById.value = {};
      feedOrder.value = [];
      nextCursor.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadMoreFeed() {
    if (!nextCursor.value) return;

    try {
      const { data } = await api.get(`/feed?cursor=${nextCursor.value}`);
      const items = Array.isArray(data?.data) ? data.data : [];

      items.forEach((post) => {
        const normalizedPost = normalizePost(post);
        if (!normalizedPost?.id) return;
        postsById.value[normalizedPost.id] = normalizedPost;
        feedOrder.value.push(normalizedPost.id);
      });

      nextCursor.value = data?.next_cursor || null;
    } catch (error) {
      console.error(error);
    }
  }

  async function toggleLike(postId) {
    const post = postsById.value[postId];

    if (!post) return;

    const originalState = Boolean(post.isLiked);
    const originalLikesCount = Number(post.likesCount || 0);

    // 🔥 Atualização otimista
    post.isLiked = !post.isLiked;
    post.likesCount = originalLikesCount + (post.isLiked ? 1 : -1);

    try {
      if (post.isLiked) {
        await api.post(`/posts/${postId}/like`);
      } else {
        await api.delete(`/posts/${postId}/unlike`);
      }
    } catch (error) {
      // ❌ Reverte em caso de erro
      post.isLiked = originalState;
      post.likesCount = originalLikesCount;
      throw error;
    }
  }

  async function addComment(postId, body) {
    const post = postsById.value[postId];

    try {
      const { data } = await api.post(`/posts/${postId}/comments`, {
        body,
      });

      if (post) {
        if (!post.comments) post.comments = [];

        post.comments.unshift(data);
      }
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      // Sincroniza com o backend para manter os comentarios persistidos no estado local.
      if (postId) {
        try {
          const { data } = await api.get(`/posts/${postId}`);
          const freshPost = data?.data ?? data;
          if (freshPost?.id) {
            postsById.value[freshPost.id] = normalizePost({
              ...(postsById.value[freshPost.id] || {}),
              ...freshPost,
            });
          }
        } catch (_syncError) {
          // Mantem a UI funcional mesmo se a sincronizacao falhar.
        }
      }
    }
  }

  async function createPost(formData) {
    try {
      const { data } = await api.post('/posts', formData);

      const normalizedPost = normalizePost(data);
      postsById.value[normalizedPost.id] = normalizedPost;
      feedOrder.value.unshift(normalizedPost.id);
    } catch (error) {
      throw error;
    }
  }

  function removePost(postId) {
    delete postsById.value[postId];
    feedOrder.value = feedOrder.value.filter((id) => id !== postId);
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
    createPost,
    removePost,
    getPostById,
    feedPosts,
  };
});