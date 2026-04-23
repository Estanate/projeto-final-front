<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import Avatar from '@/components/ui/Avatar.vue';

const route = useRoute();
const auth = useAuthStore();

const users = ref([]);
const isLoading = ref(true);
const title = ref('');

const type = route.params.type; // 'seguidores' or 'seguindo'
const targetUsername = route.query.user || auth.user.username;

const isOwnList = computed(() => !route.query.user || route.query.user === auth.user.username);

onMounted(async () => {
  await fetchList();
});

async function fetchList() {
  isLoading.value = true;
  try {
    let endpoint;
    if (type === 'seguidores') {
      endpoint = `/users/${targetUsername}/followers`;
      title.value = isOwnList.value ? 'Seguidores' : `Seguidores de ${targetUsername}`;
    } else if (type === 'seguindo') {
      endpoint = `/users/${targetUsername}/following`;
      title.value = isOwnList.value ? 'Seguindo' : `Pessoas que ${targetUsername} segue`;
    } else {
      throw new Error('Tipo inválido');
    }

    const { data } = await api.get(endpoint);
    users.value = data;
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="lista-conexoes">
    <h2>{{ title }}</h2>

    <div v-if="isLoading" class="text-center py-4">
      Carregando...
    </div>

    <div v-else-if="!users.length" class="text-center py-4">
      Nenhum usuário encontrado.
    </div>

    <div v-else class="users-list">
      <div
        v-for="user in users"
        :key="user.id"
        class="user-item"
        @click="$router.push(`/perfil?user=${user.username}`)"
      >
        <Avatar :src="user.avatar" :alt="user.name" size="md" />
        <div class="user-info">
          <div class="username">{{ user.username }}</div>
          <div class="name">{{ user.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lista-conexoes {
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