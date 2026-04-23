<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import Avatar from '@/components/ui/Avatar.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const profile = ref(null);
const posts = ref([]);
const followersCount = ref(0);
const followingCount = ref(0);
const isFollowing = ref(false);
const isLoading = ref(true);
const errorMessage = ref('');

const isOwnProfile = computed(() => !route.query.user || route.query.user === auth.user?.username);

const targetUsername = computed(() => route.query.user || auth.user?.username);

onMounted(async () => {
  await fetchProfile();
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
  const { data } = await api.get(`/users/${profile.value.id}/posts`);
  posts.value = data;
}

async function fetchFollowersCount() {
  const { data } = await api.get(`/users/${profile.value.id}/followers`);
  followersCount.value = data.length;
}

async function fetchFollowingCount() {
  const { data } = await api.get(`/users/${profile.value.id}/following`);
  followingCount.value = data.length;
}

async function fetchIsFollowing() {
  try {
    const { data } = await api.get(`/users/${profile.value.id}/is-following`);
    isFollowing.value = data.isFollowing;
  } catch (error) {
    isFollowing.value = false;
  }
}

async function toggleFollow() {
  if (isOwnProfile.value) return;

  try {
    if (isFollowing.value) {
      await api.delete(`/users/${profile.value.id}/unfollow`);
      isFollowing.value = false;
      followersCount.value--;
    } else {
      await api.post(`/users/${profile.value.id}/follow`);
      isFollowing.value = true;
      followersCount.value++;
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
      <Avatar :src="profile.avatar" :alt="profile.name" size="lg" />
      <div class="profile-info">
        <h2>{{ profile.username }}</h2>
        <p v-if="profile.bio">{{ profile.bio }}</p>

        <div class="stats">
          <button @click="goToLista('seguidores')" class="stat">
            <strong>{{ followersCount }}</strong> seguidores
          </button>
          <button @click="goToLista('seguindo')" class="stat">
            <strong>{{ followingCount }}</strong> seguindo
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
      <div
        v-for="post in posts"
        :key="post.id"
        class="post-thumb"
        @click="$router.push(`/posts/${post.id}`)"
      >
        <img :src="post.image" :alt="post.caption" />
      </div>
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
