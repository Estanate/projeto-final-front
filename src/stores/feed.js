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

  function getPostById(id) {
    return postsById.value[id];
  }

  // 🔹 ACTIONS

  async function fetchFeed() {
    isLoading.value = true;

    try {
      const { data } = await api.get('/feed');

      postsById.value = {};
      feedOrder.value = [];

      data.data.forEach((post) => {
        postsById.value[post.id] = post;
        feedOrder.value.push(post.id);
      });

      nextCursor.value = data.next_cursor;
    } catch (error) {
      console.error(error);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadMoreFeed() {
    if (!nextCursor.value) return;

    try {
      const { data } = await api.get(`/feed?cursor=${nextCursor.value}`);

      data.data.forEach((post) => {
        postsById.value[post.id] = post;
        feedOrder.value.push(post.id);
      });

      nextCursor.value = data.next_cursor;
    } catch (error) {
      console.error(error);
    }
  }

  async function toggleLike(postId) {
    const post = postsById.value[postId];

    if (!post) return;

    const originalState = post.isLiked;

    // 🔥 Atualização otimista
    post.isLiked = !post.isLiked;
    post.likesCount += post.isLiked ? 1 : -1;

    try {
      if (post.isLiked) {
        await api.post(`/posts/${postId}/like`);
      } else {
        await api.delete(`/posts/${postId}/unlike`);
      }
    } catch (error) {
      // ❌ Reverte em caso de erro
      post.isLiked = originalState;
      post.likesCount += post.isLiked ? 1 : -1;
    }
  }

  async function addComment(postId, body) {
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, {
        body,
      });

      const post = postsById.value[postId];

      if (post) {
        if (!post.comments) post.comments = [];

        post.comments.unshift(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function createPost(formData) {
    try {
      const { data } = await api.post('/posts', formData);

      postsById.value[data.id] = data;
      feedOrder.value.unshift(data.id);
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