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
        return true;
      }
    } catch (error) {
      console.warn('Erro ao carregar feed do localStorage:', error);
    }
    return false;
  }

  function clearFeedStorage() {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (error) {
      console.warn('Erro ao limpar feed do localStorage:', error);
    }
  }

  function getPostId(post) {
    return post?.id ?? post?.post_id ?? post?.postId ?? null;
  }

  function normalizePost(post, previousPost = null) {
    const postId = getPostId(post);
    if (!postId) return post;

    const normalized = { ...post };
    normalized.id = postId;
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
    let isLiked = rawIsLiked === true || rawIsLiked === 1 || rawIsLiked === '1';

    if (!isLiked && Array.isArray(normalized.likes) && auth.user?.id) {
      isLiked = normalized.likes.some((like) => {
        if (like == null) return false;
        if (typeof like === 'number' || typeof like === 'string') {
          return Number(like) === Number(auth.user.id);
        }

        return Number(like.id ?? like.user_id ?? like.userId) === Number(auth.user.id);
      });
    }

    if (!isLiked && previousPost?.isLiked === true && rawIsLiked == null) {
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
      id: comment.id ?? comment.comment_id ?? comment.uuid ?? null,
      body: comment.body ?? comment.content ?? '',
      createdAt: comment.createdAt ?? comment.created_at ?? null,
    };
  }

  function getCommentKey(comment, fallbackIndex = 0) {
    if (comment?.id != null) return `id:${comment.id}`;
    if (comment?.createdAt || comment?.created_at) {
      return `date:${comment.createdAt || comment.created_at}:${comment.body || ''}`;
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
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.comments)) return payload.comments;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
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
    const post = postsById.value[postId];

    if (!post) return;

    const originalState = Boolean(post.isLiked);
    const originalLikesCount = Number(post.likesCount || 0);

    // 🔥 Atualização otimista
    post.isLiked = !post.isLiked;
    post.likesCount = originalLikesCount + (post.isLiked ? 1 : -1);
    saveFeedToStorage();

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

      const normalizedPost = normalizePost(data);
      postsById.value[normalizedPost.id] = normalizedPost;
      feedOrder.value.unshift(normalizedPost.id);
      saveFeedToStorage();
    } catch (error) {
      throw error;
    }
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
    feedPosts,
    loadFeedFromStorage,
    clearFeedStorage,
  };
});