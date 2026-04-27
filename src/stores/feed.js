import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';

export const useFeedStore = defineStore('feed', () => {
  // 🔹 STATE
  const STORAGE_KEY_BASE = 'instaclone.feed';
  const auth = useAuthStore();
  
  const postsById = ref({});
  const feedOrder = ref([]);
  const nextCursor = ref(null);
  const isLoading = ref(false);
  const activeUserId = ref(null);
  const hasLoadedStorage = ref(false);

  // 🔹 GETTERS
  const feedPosts = computed(() =>
    feedOrder.value.map((id) => postsById.value[id])
  );

  // 🔹 HELPER FUNCTIONS
  function getStorageKey() {
    const userId = auth.user?.id;
    return userId ? `${STORAGE_KEY_BASE}.${userId}` : STORAGE_KEY_BASE;
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
    } catch (error) {
      console.warn('Erro ao salvar feed no localStorage:', error);
    }
  }

  function loadFeedFromStorage() {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const { postsById: storedPosts, feedOrder: storedOrder, nextCursor: storedCursor } = JSON.parse(stored);
        postsById.value = storedPosts || {};
        feedOrder.value = storedOrder || [];
        nextCursor.value = storedCursor || null;
        hasLoadedStorage.value = true;
        return true;
      }
    } catch (error) {
      console.warn('Erro ao carregar feed do localStorage:', error);
    }
    hasLoadedStorage.value = true;
    return false;
  }

  function restoreFeedFromStorage() {
    if (hasLoadedStorage.value) return;
    loadFeedFromStorage();
  }

  function clearFeedStorage() {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (error) {
      console.warn('Erro ao limpar feed do localStorage:', error);
    }
  }

  function getPostId(post) {
    return post?.id ?? null;
  }

  function normalizePost(post, previousPost = null) {
    const postId = getPostId(post);
    if (!postId) return post;

    const normalized = { ...post };
    normalized.id = postId;
    const likesCount = Number(normalized.likes_count ?? normalized.likesCount ?? normalized.likeCount ?? (Array.isArray(normalized.likes) ? normalized.likes.length : 0));
    normalized.likesCount = Number.isFinite(likesCount) ? likesCount : 0;

    const rawIsLiked = normalized.liked_by_me ?? normalized.is_liked ?? normalized.liked ?? normalized.isLiked;
    let isLiked = rawIsLiked === true || rawIsLiked === 1 || rawIsLiked === '1';

    if (!isLiked && Array.isArray(normalized.likes) && auth.user?.id) {
      isLiked = normalized.likes.some((like) => {
        if (like == null) return false;
        if (typeof like === 'number' || typeof like === 'string') return Number(like) === Number(auth.user.id);
        return Number(like.id ?? like.user_id ?? like.userId) === Number(auth.user.id);
      });
    }

    if (!isLiked && previousPost?.isLiked === true) {
      isLiked = true;
    }

    normalized.isLiked = isLiked;

    const payloadComments = Array.isArray(normalized.comments)
      ? normalized.comments.map(normalizeComment).filter(Boolean)
      : null;
    const previousComments = Array.isArray(previousPost?.comments)
      ? previousPost.comments.map(normalizeComment).filter(Boolean)
      : null;

    if (!payloadComments && previousComments) {
      normalized.comments = [...previousComments];
    } else if (payloadComments && previousComments) {
      const knownComments = previousComments;
      // Alguns payloads de /feed trazem comments vazio/parcial; preserva o que já sabemos.
      const byId = new Map();

      knownComments.forEach((comment, index) => {
        const key = getCommentKey(comment, index);
        byId.set(key, comment);
      });

      payloadComments.forEach((comment, index) => {
        const key = getCommentKey(comment, index);
        byId.set(key, comment);
      });

      normalized.comments = Array.from(byId.values());
    }

    return normalized;
  }

  function normalizeComment(rawComment) {
    if (!rawComment) return null;

    const comment = rawComment?.data ?? rawComment;
    if (!comment || typeof comment !== 'object') return null;

    return {
      ...comment,
      id: comment.id ?? null,
      body: comment.body ?? '',
      createdAt: comment.created_at ?? null,
    };
  }

  function getCommentKey(comment, fallbackIndex = 0) {
    if (comment?.id != null) return `id:${comment.id}`;
    if (comment?.createdAt) {
      return `date:${comment.createdAt}:${comment.body || ''}`;
    }
    if (comment?.body) return `body:${comment.body}:${fallbackIndex}`;
    return `fallback:${fallbackIndex}`;
  }

  function getPostById(id) {
    return postsById.value[id];
  }

  function extractCommentsFromPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }

  async function fetchCommentsForPost(postId) {
    if (!postId) return [];

    try {
      const { data } = await api.get(`/posts/${postId}/comments`);
      const rawComments = extractCommentsFromPayload(data);
      return rawComments.map(normalizeComment).filter(Boolean);
    } catch (_error) {
      return [];
    }
  }

  function getPayloadFromResponse(response) {
    if (response == null) return null;
    if (Array.isArray(response)) return response;
    if (typeof response !== 'object') return response;

    if (response.post) return getPayloadFromResponse(response.post);
    if (response.item) return getPayloadFromResponse(response.item);
    if (response.data) return getPayloadFromResponse(response.data);
    if (response.payload) return getPayloadFromResponse(response.payload);
    return response;
  }

  // 🔹 ACTIONS

  async function fetchFeed() {
    ensureUserScope();
    const requestUserId = auth.user?.id ?? null;
    isLoading.value = true;

    try {
      const { data } = await api.get('/feed');
      if ((auth.user?.id ?? null) !== requestUserId) return;
      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
          ? data.data
          : [];
      const previousPostsById = { ...postsById.value };

      // Limpa e reconstrói o estado apenas se o fetch for bem-sucedido
      postsById.value = {};
      feedOrder.value = [];

      items.forEach((post) => {
        const postId = getPostId(post);
        const normalizedPost = normalizePost(post, previousPostsById[postId]);
        if (!normalizedPost?.id) return;
        postsById.value[normalizedPost.id] = normalizedPost;
        feedOrder.value.push(normalizedPost.id);
      });

      nextCursor.value = data?.next_cursor || null;
      saveFeedToStorage();

      const commentHydrationTasks = feedOrder.value.map(async (postId) => {
        const currentPost = postsById.value[postId];
        if (!currentPost) return;
        if (Array.isArray(currentPost.comments) && currentPost.comments.length > 0) return;

        const backendComments = await fetchCommentsForPost(postId);
        if (backendComments.length > 0) {
          currentPost.comments = backendComments;
        }
      });
      await Promise.all(commentHydrationTasks);
      saveFeedToStorage();
    } catch (error) {
      console.error(error);
      // Em caso de erro, mantém os dados em memória ou carrega do storage
      // Só limpa se não houver dados salvos
      if (!postsById.value || Object.keys(postsById.value).length === 0) {
        if (!loadFeedFromStorage()) {
          postsById.value = {};
          feedOrder.value = [];
          nextCursor.value = null;
        }
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function loadMoreFeed() {
    ensureUserScope();
    const requestUserId = auth.user?.id ?? null;
    if (!nextCursor.value) return;

    try {
      const { data } = await api.get(`/feed?cursor=${nextCursor.value}`);
      if ((auth.user?.id ?? null) !== requestUserId) return;
      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
          ? data.data
          : [];

      items.forEach((post) => {
        const postId = getPostId(post);
        const normalizedPost = normalizePost(post, postsById.value[postId]);
        if (!normalizedPost?.id) return;
        postsById.value[normalizedPost.id] = normalizedPost;
        feedOrder.value.push(normalizedPost.id);
      });

      nextCursor.value = data?.next_cursor || null;
      saveFeedToStorage();
    } catch (error) {
      console.error(error);
    }
  }

  async function toggleLike(postId) {
    restoreFeedFromStorage();

    let post = postsById.value[postId];
    if (!post) {
      post = { id: postId, isLiked: false, likesCount: 0 };
      postsById.value[postId] = post;
      if (!feedOrder.value.includes(postId)) {
        feedOrder.value.unshift(postId);
      }
    }

    const originalState = Boolean(post.isLiked);
    const originalLikesCount = Number(post.likesCount || 0);

    // 🔥 Atualização otimista
    post.isLiked = !originalState;
    post.likesCount = Math.max(0, originalLikesCount + (post.isLiked ? 1 : -1));
    saveFeedToStorage();

    try {
      if (post.isLiked) {
        await api.post(`/posts/${postId}/like`);
      } else {
        await api.delete(`/posts/${postId}/like`);
      }
    } catch (error) {
      // ❌ Reverte em caso de erro
      post.isLiked = originalState;
      post.likesCount = originalLikesCount;
      saveFeedToStorage();
      throw error;
    }
  }

  async function addComment(postId, body) {
    const post = postsById.value[postId];

    try {
      const { data } = await api.post(`/posts/${postId}/comments`, {
        body,
      });
      const normalizedComment = normalizeComment(data);

      if (post) {
        if (!post.comments) post.comments = [];

        if (normalizedComment) {
          post.comments.unshift(normalizedComment);
        }
        saveFeedToStorage();
      }
      return normalizedComment ?? data;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      // Sincroniza com o backend para manter os comentarios persistidos no estado local.
      if (postId) {
        try {
          const backendComments = await fetchCommentsForPost(postId);
          if (postsById.value[postId]) {
            postsById.value[postId].comments = backendComments;
            saveFeedToStorage();
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
      const postPayload = getPayloadFromResponse(data);
      const normalizedPost = normalizePost(postPayload);

      if (!normalizedPost?.id) {
        throw new Error('Resposta de criação de post inválida');
      }

      postsById.value[normalizedPost.id] = normalizedPost;
      feedOrder.value.unshift(normalizedPost.id);
      saveFeedToStorage();
      return normalizedPost;
    } catch (error) {
      throw error;
    }
  }

  function setPost(post) {
    const normalized = normalizePost(post, postsById.value[getPostId(post)]);
    if (!normalized?.id) return null;

    postsById.value[normalized.id] = normalized;
    if (!feedOrder.value.includes(normalized.id)) {
      feedOrder.value.unshift(normalized.id);
    }
    saveFeedToStorage();
    return normalized;
  }

  function removePost(postId) {
    delete postsById.value[postId];
    feedOrder.value = feedOrder.value.filter((id) => id !== postId);
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
    createPost,
    removePost,
    getPostById,
    setPost,
    feedPosts,
    loadFeedFromStorage,
    restoreFeedFromStorage,
    clearFeedStorage,
  };
});