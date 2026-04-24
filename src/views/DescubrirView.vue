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
const page = ref(1);
const hasMore = ref(true);

onMounted(() => {
  fetchSuggestions();
  if (auth.user) {
    fetchFollowing();
  }
});

async function fetchSuggestions() {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    const { data } = await api.get('/users/suggestions', {
      params: { page: page.value },
    });

    if (data.data.length === 0) {
      hasMore.value = false;
    } else {
      suggestions.value.push(...data.data);
      page.value++;
    }
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

async function fetchFollowing() {
  if (!auth.user) return;
  try {
    const { data } = await api.get(`/users/${auth.user.id}/following`);
    // Corrige para acessar data.data, que é o array de usuários
    following.value = new Set((data.data || []).map(u => u.id));
  } catch (error) {
    console.error(error);
  }
}

async function toggleFollow(user) {
  const isFollowing = following.value.has(user.id);

  try {
    if (isFollowing) {
      await api.delete(`/users/${user.id}/unfollow`);
      following.value.delete(user.id);
    } else {
      await api.post(`/users/${user.id}/follow`);
      following.value.add(user.id);
    }
  } catch (error) {
    console.error(error);
  }
}

function openProfile(user) {
  if (!user?.username) return;
  if (auth.user?.username && user.username === auth.user.username) {
    router.push('/perfil');
    return;
  }
  router.push(`/perfil?user=${user.username}`);
}
</script>

<template>
  <div class="descobrir">
    <h2>Sugestões para seguir</h2>

    <div class="suggestions">
      <div
        v-for="user in suggestions"
        :key="user.id"
        class="user-card"
        @click="openProfile(user)"
      >
        <Avatar :src="user.avatar" :alt="user.name" size="lg" />
        <div class="user-info">
          <div class="username">{{ user.username }}</div>
          <div class="name">{{ user.name }}</div>
        </div>
        <button
          @click.stop="toggleFollow(user)"
          :class="['follow-btn', { following: following.has(user.id) }]"
        >
          {{ following.has(user.id) ? 'Seguindo' : 'Seguir' }}
        </button>
      </div>
    </div>

    <div v-if="hasMore" class="load-more">
      <button @click="fetchSuggestions" :disabled="isLoading" class="btn btn-primary">
        {{ isLoading ? 'Carregando...' : 'Carregar mais' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.descobrir {
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

.name {
  font-size: 14px;
  color: var(--color-text-muted);
}

.follow-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-primary);
  background: white;
  color: var(--color-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
}

.follow-btn.following {
  background: var(--color-primary);
  color: white;
}

.load-more {
  text-align: center;
  padding: 16px;
}
</style>
