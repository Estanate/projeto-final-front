<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import Avatar from '@/components/ui/Avatar.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const users = ref([]);
const isLoading = ref(true);
const title = ref('');
const errorMessage = ref('');
const page = ref(1);
const hasMore = ref(false);
const isLoadingMore = ref(false);
const followingIds = ref(new Set());
const targetUserId = ref(null);

const type = computed(() => route.params.type);
const targetUsername = computed(() => route.query.user || auth.user?.username);

const isOwnList = computed(() => !route.query.user || route.query.user === auth.user?.username);

onMounted(async () => {
  await fetchList();
});

watch(
  () => [route.params.type, route.query.user],
  async () => {
    await fetchList();
  }
);

async function fetchList() {
  isLoading.value = true;
  errorMessage.value = '';
  page.value = 1;
  try {
    if (!targetUsername.value) {
      users.value = [];
      return;
    }

    const { data: userData } = await api.get(`/users/${targetUsername.value}`);
    targetUserId.value = userData?.id;
    if (!targetUserId.value) {
      throw new Error('Target user without ID');
    }

    let endpoint;
    if (type.value === 'followers') {
      endpoint = `/users/${targetUserId.value}/followers`;
      title.value = isOwnList.value ? 'Followers' : `${targetUsername.value}'s followers`;
    } else if (type.value === 'following') {
      endpoint = `/users/${targetUserId.value}/following`;
      title.value = isOwnList.value ? 'Following' : `People ${targetUsername.value} follows`;
    } else {
      throw new Error('Invalid type');
    }

    const { data } = await api.get(`${endpoint}?page=1`);
    users.value = extractItems(data);
    hasMore.value = resolveHasMore(data, users.value.length);
    await fetchFollowingIds();
  } catch (error) {
    console.error(error);
    users.value = [];
    errorMessage.value = 'Nao foi possivel carregar esta lista.';
  } finally {
    isLoading.value = false;
  }
}

function extractItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function resolveHasMore(payload, itemCount) {
  const meta = payload?.meta || payload?.pagination;
  if (meta?.current_page && meta?.last_page) {
    return Number(meta.current_page) < Number(meta.last_page);
  }
  if (meta?.next_page_url) return Boolean(meta.next_page_url);
  return itemCount > 0;
}

async function fetchFollowingIds() {
  if (!auth.user?.id) return;

  try {
    const { data } = await api.get(`/users/${auth.user.id}/following`);
    const items = extractItems(data);
    followingIds.value = new Set(items.map((user) => user?.id).filter(Boolean));
  } catch (_error) {
    followingIds.value = new Set();
  }
}

function isMe(user) {
  return Boolean(user?.id && auth.user?.id && Number(user.id) === Number(auth.user.id));
}

function isFollowing(user) {
  return followingIds.value.has(user?.id);
}

async function toggleFollow(user) {
  if (!user?.id || isMe(user)) return;
  try {
    if (isFollowing(user)) {
      await api.delete(`/users/${user.id}/follow`);
      followingIds.value.delete(user.id);
    } else {
      await api.post(`/users/${user.id}/follow`);
      followingIds.value.add(user.id);
    }
    followingIds.value = new Set(followingIds.value);
  } catch (error) {
    console.error(error);
  }
}

async function loadMore() {
  if (!hasMore.value || isLoadingMore.value) return;
  isLoadingMore.value = true;
  const nextPage = page.value + 1;
  try {
    let endpoint = '';
    if (type.value === 'followers') endpoint = `/users/${targetUserId.value}/followers`;
    if (type.value === 'following') endpoint = `/users/${targetUserId.value}/following`;
    if (!endpoint) return;

    const { data } = await api.get(`${endpoint}?page=${nextPage}`);
    const newItems = extractItems(data);
    users.value = [...users.value, ...newItems];
    page.value = nextPage;
    hasMore.value = resolveHasMore(data, newItems.length);
  } catch (error) {
    console.error(error);
  } finally {
    isLoadingMore.value = false;
  }
}

function goBackToProfile() {
  const query = isOwnList.value ? {} : { user: targetUsername.value };
  router.push({ path: '/profile', query });
}
</script>

<template>
  <div class="connections-list">
    <button class="btn btn-outline-secondary btn-sm mb-3" @click="goBackToProfile">
      Back to profile
    </button>
    <h2>{{ title }}</h2>

    <div v-if="isLoading" class="text-center py-4">
      Loading...
    </div>

    <div v-else-if="errorMessage" class="text-center py-4 text-danger">
      {{ errorMessage }}
    </div>

    <div v-else-if="!users.length" class="text-center py-4">
      No users found.
    </div>

    <div v-else class="users-list">
      <div
        v-for="user in users"
        :key="user.id"
        class="user-item"
        @click="$router.push(`/profile?user=${user.username}`)"
      >
        <Avatar :src="user.avatar" :alt="user.name" size="md" />
        <div class="user-info">
          <div class="username">{{ user.username }}</div>
          <div class="name">{{ user.name }}</div>
        </div>
        <button
          v-if="!isMe(user)"
          class="btn btn-sm"
          :class="isFollowing(user) ? 'btn-outline-primary' : 'btn-primary'"
          @click.stop="toggleFollow(user)"
        >
          {{ isFollowing(user) ? 'Following' : 'Follow' }}
        </button>
      </div>
      <button
        v-if="hasMore"
        class="btn btn-outline-primary w-100"
        :disabled="isLoadingMore"
        @click="loadMore"
      >
        {{ isLoadingMore ? 'Loading...' : 'Load more' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.connections-list {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s;
}

.user-item:hover {
  background: var(--color-bg);
}

.user-info {
  flex: 1;
}

.username {
  font-weight: 600;
}

.name {
  font-size: 14px;
  color: var(--color-text-muted);
}
</style>
