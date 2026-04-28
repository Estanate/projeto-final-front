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
const posts = ref([]);
const followersCount = ref(0);
const followingCount = ref(0);
const isFollowing = ref(false);
const isLoading = ref(true);
const errorMessage = ref('');

const isOwnProfile = computed(() => !route.query.user || route.query.user === auth.user?.username);
const targetUsername = computed(() => route.query.user || auth.user?.username);

function extractCount(payload) {
  if (!payload || typeof payload !== 'object') return 0;
  
  // 1. Check for Laravel pagination meta
  if (payload.meta && Number.isFinite(Number(payload.meta.total))) {
    return Number(payload.meta.total);
  }
  
  // 2. Check for explicit count keys in the payload
  const numericKeys = ['followers_count', 'following_count', 'posts_count', 'total', 'count'];
  for (const key of numericKeys) {
    if (Number.isFinite(Number(payload[key]))) return Number(payload[key]);
  }
  
  // 3. Fallback to array length
  if (Array.isArray(payload)) return payload.length;
  if (Array.isArray(payload.data)) return payload.data.length;
  
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
    followersCount.value = extractCount(data);
    followingCount.value = extractCount(data);
    await Promise.all([
      fetchPosts(),
      fetchFollowersCount(),
      fetchFollowingCount(),
      isOwnProfile.value ? Promise.resolve() : fetchIsFollowing(),
    ]);
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Error loading profile. Check if the backend is running.';
  } finally {
    isLoading.value = false;
  }
}

async function fetchPosts() {
  if (!profile.value?.id) { posts.value = []; return; }
  const { data } = await api.get(`/users/${profile.value.id}/posts`);
  posts.value = extractItems(data);
}

async function fetchFollowersCount() {
  if (!profile.value?.id) { followersCount.value = 0; return; }
  try {
    const { data } = await api.get(`/users/${profile.value.id}/followers`);
    followersCount.value = extractCount(data);
  } catch { followersCount.value = 0; }
}

async function fetchFollowingCount() {
  if (!profile.value?.id) { followingCount.value = 0; return; }
  try {
    const { data } = await api.get(`/users/${profile.value.id}/following`);
    followingCount.value = extractCount(data);
  } catch { followingCount.value = 0; }
}

async function fetchIsFollowing() {
  if (isOwnProfile.value || !profile.value?.id) return;
  try {
    const { data } = await api.get(`/users/${profile.value.id}/is-following`);
    const status = extractIsFollowing(data);
    if (status !== null) { isFollowing.value = status; return; }
    const { data: followersData } = await api.get(`/users/${profile.value.id}/followers`);
    const followers = extractItems(followersData);
    isFollowing.value = followers.some((user) =>
      user && ((auth.user?.id && user.id === auth.user.id) || (auth.user?.username && user.username === auth.user.username))
    );
  } catch { isFollowing.value = false; }
}

watch(() => auth.user?.id, async (newId) => {
  if (newId && profile.value?.id && !isOwnProfile.value) await fetchIsFollowing();
});

watch(() => targetUsername.value, async (newUsername, oldUsername) => {
  if (!newUsername || newUsername === oldUsername) return;
  await fetchProfile();
});

async function toggleFollow() {
  if (isOwnProfile.value || !profile.value?.id) return;
  try {
    if (isFollowing.value) {
      await api.post(`/users/${profile.value.id}/unfollow`);
      isFollowing.value = false;
      followersCount.value = Math.max(0, Number(followersCount.value || 0) - 1);
    } else {
      await api.post(`/users/${profile.value.id}/follow`);
      isFollowing.value = true;
      followersCount.value = Number(followersCount.value || 0) + 1;
    }
  } catch (error) { console.error(error); }
}

function goToLista(type) {
  const query = isOwnProfile.value ? {} : { user: targetUsername.value };
  router.push({ path: `/profile/list/${type}`, query });
}
</script>

<template>
  <div v-if="isLoading" class="text-center py-4">Loading...</div>

  <div v-else-if="errorMessage" class="text-center py-4 text-danger">{{ errorMessage }}</div>

  <div v-else-if="profile" class="profile">
    <header class="profile-header">
      <Avatar :src="profile.avatar" :alt="profile.name" size="lg" />
      <div class="profile-info">
        <h2>{{ profile.username }}</h2>
        <p v-if="profile.bio">{{ profile.bio }}</p>
        <div class="stats">
          <button @click="goToLista('followers')" class="stat">
            <strong>{{ Number(followersCount || 0) }}</strong> followers
          </button>
          <button @click="goToLista('following')" class="stat">
            <strong>{{ Number(followingCount || 0) }}</strong> following
          </button>
        </div>
        <div class="actions">
          <button v-if="isOwnProfile" @click="$router.push('/profile/edit')" class="btn btn-outline-primary">
            Edit profile
          </button>
          <button v-else @click="toggleFollow" :class="['btn', isFollowing ? 'btn-outline-primary' : 'btn-primary']">
            {{ isFollowing ? 'Following' : 'Follow' }}
          </button>
        </div>
      </div>
    </header>

    <div class="posts-grid">
      <template v-for="post in posts" :key="post.id">
        <div v-if="post && post.id" class="post-thumb" @click="$router.push(`/posts/${post.id}`)">
          <img v-if="post.image_url" :src="post.image_url" :alt="post.caption || ''" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.profile { max-width: 600px; margin: 0 auto; padding: 16px; }
.profile-header { display: flex; gap: 32px; margin-bottom: 32px; }
.profile-info { flex: 1; }
h2 { margin-bottom: 8px; }
.stats { display: flex; gap: 16px; margin: 16px 0; }
.stat { background: none; border: none; cursor: pointer; font-size: 14px; }
.actions { margin-top: 16px; }
.posts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
.post-thumb { aspect-ratio: 1; overflow: hidden; cursor: pointer; }
.post-thumb img { width: 100%; height: 100%; object-fit: cover; }
</style>
