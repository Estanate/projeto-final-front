import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// 🔥 Lazy loading obrigatório em TODAS as views
const LoginView = () => import('@/views/auth/LoginView.vue');
const CadastroView = () => import('@/views/auth/CadastroView.vue');

const FeedView = () => import('@/views/FeedView.vue');
const DescubrirView = () => import('@/views/DescubrirView.vue');
const CriarPostView = () => import('@/views/CriarPostView.vue');
const PerfilView = () => import('@/views/PerfilView.vue');
const EditarPerfilView = () => import('@/views/EditarPerfilView.vue');
const ListaConexoesView = () => import('@/views/ListaConexoesView.vue');
const PostDetailView = () => import('@/views/PostDetailView.vue');

const AuthLayout = () => import('@/layouts/AuthLayout.vue');
const AppLayout = () => import('@/layouts/AppLayout.vue');

import NotFoundView from '@/views/NotFoundView.vue';

// 🔹 ROTAS
const routes = [
  {
    path: '/',
    redirect: '/feed', // 👉 rota raiz SEMPRE vai pro feed
  },

  // 🔐 ROTAS DE VISITANTE
  {
    path: '/',
    component: AuthLayout,
    children: [
      {
        path: '/login',
        component: LoginView,
        meta: { requiresGuest: true },
      },
      {
        path: '/cadastro',
        component: CadastroView,
        meta: { requiresGuest: true },
      },
    ],
  },

  // 🔒 ROTAS AUTENTICADAS
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '/feed',
        component: FeedView,
        meta: { requiresAuth: true },
      },
      {
        path: '/descobrir',
        component: DescubrirView,
        meta: { requiresAuth: true },
      },
      {
        path: '/criar',
        component: CriarPostView,
        meta: { requiresAuth: true },
      },
      {
        path: '/perfil',
        component: PerfilView,
        meta: { requiresAuth: true },
      },
      {
        path: '/perfil/editar',
        component: EditarPerfilView,
        meta: { requiresAuth: true },
      },
      {
        path: '/perfil/lista/:type',
        component: ListaConexoesView,
        meta: { requiresAuth: true },
      },
      {
        path: '/posts/:postId',
        component: PostDetailView,
        meta: { requiresAuth: true },
      },
    ],
  },

  // ❌ 404 (sem layout)
  {
    path: '/:pathMatch(.*)*',
    component: NotFoundView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});


// 🔐 GUARDS

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login';
  }

  if (to.meta.requiresGuest && auth.isAuthenticated) {
    return '/feed';
  }

  return true;
});

export default router;