<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import Avatar from '@/components/ui/Avatar.vue';

const router = useRouter();
const auth = useAuthStore();

const suggestions = ref([]);
const following = ref(new Set());
const isLoading = ref(false);

onMounted(() => {
  fetchSuggestions();
  if (auth.isAuthenticated) fetchFollowing();
});

async function fetchSuggestions() {
  isLoading.value = true;
  try {
    const { data } = await api.get('/users/suggestions');
    suggestions.value = data.data || [];
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

async function fetchFollowing() {
  try {
    const { data } = await api.get(`/users/${auth.user.id}/following`);
    following.value = new Set((data.data || []).map(u => u.id));
  } catch (e) {
    console.error(e);
  }
}

async function toggleFollow(user) {
  const isFollowing = following.value.has(user.id);
  try {
    if (isFollowing) {
      await api.post(`/users/${user.id}/unfollow`);
      following.value.delete(user.id);
    } else {
      await api.post(`/users/${user.id}/follow`);
      following.value.add(user.id);
    }
  } catch (e) {
    console.error(e);
  }
}

function openProfile(user) {
  if (user.username === auth.user?.username) router.push('/profile');
  else router.push(`/profile?user=${user.username}`);
}
</script>

<template>
  <div class="discover">
    <h2>Suggestions to follow</h2>

    <div v-if="isLoading" class="text-center py-4">Loading...</div>

    <div class="suggestions">
      <div v-for="user in suggestions" :key="user.id" class="user-card" @click="openProfile(user)">
        <Avatar :src="user.avatar" :alt="user.username" size="lg" />
        <div class="user-info">
          <div class="username">{{ user.username }}</div>
          <div class="name">{{ user.name }}</div>
        </div>
        <button @click.stop="toggleFollow(user)" :class="['follow-btn', { following: following.has(user.id) }]">
          {{ following.has(user.id) ? 'Following' : 'Follow' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>

.discover { 
  max-width: 600px; 
  margin: 0 auto; 
  padding: 16px; 
}

h2 { 
  margin-bottom: 16px; 
}

.suggestions { 
  display: flex; 
  flex-direction: column; 
  gap: 16px; 
}

.user-card { 
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

.user-card:hover { 
  background: var(--color-bg); 
}

.user-info { 
  flex: 1; 
}

.username { 
  font-weight: 600; 
}

.name { font-size: 14px; 
  color: var(--color-text-muted); 
}

.follow-btn { padding: 6px 12px; 
  border: 1px solid var(--color-primary); 
  background: var(--color-primary); 
  color: white; 
  border-radius: var(--radius-sm); 
  cursor: pointer; 
  font-weight: 600; 
}
.follow-btn.following { 
  background: transparent; 
  color: var(--color-primary); 
}

</style>

