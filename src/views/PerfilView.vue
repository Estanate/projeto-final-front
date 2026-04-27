<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import Avatar from '@/components/ui/Avatar.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const profile = ref(null);
const posts = ref([]); // Sempre array
const followersCount = ref(0);
const followingCount = ref(0);
const isFollowing = ref(false);
const isLoading = ref(true);
const errorMessage = ref('');

const isOwnProfile = computed(() => !route.query.user || route.query.user === auth.user?.username);

const targetUsername = computed(() => route.query.user || auth.user?.username);

function extractCount(payload) {
  if (Array.isArray(payload)) return payload.length;
  if (!payload || typeof payload !== 'object') return 0;

  if (Array.isArray(payload.data)) return payload.data.length;

  const numericKeys = ['count', 'total', 'followers_count', 'following_count'];
  for (const key of numericKeys) {
    if (Number.isFinite(Number(payload[key]))) {
      return Number(payload[key]);
    }
  }

  if (payload.meta && Number.isFinite(Number(payload.meta.total))) {
    return Number(payload.meta.total);
  }

  return 0;
}

function extractIsFollowing(payload) {
  if (typeof payload === 'boolean') return payload;
  if (!payload || typeof payload !== 'object') return null;

  const possibleKeys = ['isFollowing', 'is_following', 'following', 'follows'];
  for (const key of possibleKeys) {
    if (typeof payload[key] === 'boolean') return payload[key];
    if (payload[key] === 1 || payload[key] === 0) return Boolean(payload[key]);
    if (payload[key] === '1' || payload[key] === '0') return payload[key] === '1';
  }

  return null;
}

function extractItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}


onMounted(async () => {
  // Aguarda o usuário estar disponível antes de buscar o perfil
  if (!targetUsername.value) {
    const unwatch = watch(
      () => auth.user,
      (val) => {
        if (val && val.username) {
          fetchProfile();
          unwatch();
        }
      },
      { immediate: true }
    );
  } else {
    await fetchProfile();
  }
});

async function fetchProfile() {
  isLoading.value = true;
  try {
    const { data } = await api.get(`/users/${targetUsername.value}`);
    profile.value = data;

    // Parallel fetches
    await Promise.all([
      fetchPosts(),
      fetchFollowersCount(),
      fetchFollowingCount(),
      isOwnProfile.value ? Promise.resolve() : fetchIsFollowing(),
    ]);
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Erro ao carregar perfil. Verifique se o backend está rodando.';
    // TODO: handle not found
  } finally {
    isLoading.value = false;
  }
}

async function fetchPosts() {
  if (!profile.value || !profile.value.id) {
    posts.value = [];
    return;
  }
  const { data } = await api.get(`/users/${profile.value.id}/posts`);
  // Aceita tanto data quanto data.data
  posts.value = Array.isArray(data) ? data : (data.data || []);
}

async function fetchFollowersCount() {
  if (!profile.value || !profile.value.id) {
    followersCount.value = 0;
    return;
  }

  try {
    const { data } = await api.get(`/users/${profile.value.id}/followers`);
    followersCount.value = extractCount(data);
  } catch (error) {
    followersCount.value = 0;
  }
}

async function fetchFollowingCount() {
  if (!profile.value || !profile.value.id) {
    followingCount.value = 0;
    return;
  }

  try {
    const { data } = await api.get(`/users/${profile.value.id}/following`);
    followingCount.value = extractCount(data);
  } catch (error) {
    followingCount.value = 0;
  }
}

async function fetchIsFollowing() {
  if (isOwnProfile.value) {
    isFollowing.value = false;
    return;
  }
  if (!profile.value || !profile.value.id) return;

  try {
    const { data } = await api.get(`/users/${profile.value.id}/is-following`);
    const status = extractIsFollowing(data);

    // Alguns backends retornam chaves diferentes (following/is_following/etc).
    if (status !== null) {
      isFollowing.value = status;
      return;
    }

    // Fallback: verifica na lista de seguidores se o usuário logado está presente.
    const { data: followersData } = await api.get(`/users/${profile.value.id}/followers`);
    const followers = extractItems(followersData);
    const meId = auth.user?.id;
    const meUsername = auth.user?.username;

    isFollowing.value = followers.some((u) => {
      if (!u) return false;
      return (meId && u.id === meId) || (meUsername && u.username === meUsername);
    });
  } catch (error) {
    isFollowing.value = false;
  }
}

watch(
  () => auth.user?.id,
  async (newId) => {
    if (newId && profile.value?.id && !isOwnProfile.value) {
      await fetchIsFollowing();
    }
  }
);

watch(
  () => targetUsername.value,
  async (newUsername, oldUsername) => {
    if (!newUsername || newUsername === oldUsername) return;
    await fetchProfile();
  }
);

async function toggleFollow() {
  if (isOwnProfile.value || !profile.value || !profile.value.id) return;

  try {
    if (isFollowing.value) {
      await api.delete(`/users/${profile.value.id}/follow`);
      isFollowing.value = false;
      followersCount.value = Math.max(0, Number(followersCount.value || 0) - 1);
    } else {
      await api.post(`/users/${profile.value.id}/follow`);
      isFollowing.value = true;
      followersCount.value = Number(followersCount.value || 0) + 1;
    }
  } catch (error) {
    console.error(error);
  }
}

function goToLista(type) {
  const query = isOwnProfile.value ? {} : { user: targetUsername.value };
  router.push({ path: `/perfil/lista/${type}`, query });
}

</script>

<template>
  <div v-if="isLoading" class="text-center py-4">
    Carregando...
  </div>

  <div v-else-if="errorMessage" class="text-center py-4 text-danger">
    {{ errorMessage }}
  </div>

  <div v-else-if="profile" class="perfil">
    <!-- Header -->
    <header class="profile-header">
      <Avatar v-if="profile" :src="profile.avatar" :alt="profile.name" size="lg" />
      <div class="profile-info" v-if="profile">
        <h2>{{ profile.username }}</h2>
        <p v-if="profile.bio">{{ profile.bio }}</p>

        <div class="stats">
          <button @click="goToLista('seguidores')" class="stat">
            <strong>{{ Number(followersCount || 0) }}</strong> seguidores
          </button>
          <button @click="goToLista('seguindo')" class="stat">
            <strong>{{ Number(followingCount || 0) }}</strong> seguindo
          </button>
        </div>

        <div class="actions">
          <button
            v-if="isOwnProfile"
            @click="$router.push('/perfil/editar')"
            class="btn btn-outline-primary"
          >
            Editar perfil
          </button>
          <button
            v-else
            @click="toggleFollow"
            :class="['btn', isFollowing ? 'btn-outline-primary' : 'btn-primary']"
          >
            {{ isFollowing ? 'Seguindo' : 'Seguir' }}
          </button>
        </div>
      </div>
    </header>

    <!-- Posts Grid -->
    <div class="posts-grid">
  <template v-for="post in posts" :key="post.id">
    <div
      v-if="post && post.id"
      class="post-thumb"
      @click="$router.push(`/posts/${post.id}`)"
    >
      <img v-if="post.image_url" :src="post.image_url" :alt="post.caption || ''" />
    </div>
  </template>
</div>
  </div>
</template>

<style scoped>
.perfil {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
}

.profile-header {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
}

.profile-info {
  flex: 1;
}

h2 {
  margin-bottom: 8px;
}

.stats {
  display: flex;
  gap: 16px;
  margin: 16px 0;
}

.stat {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.actions {
  margin-top: 16px;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}

.post-thumb {
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
}

.post-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
