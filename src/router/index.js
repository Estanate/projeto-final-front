import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const LoginView = () => import('@/views/auth/LoginView.vue');
const RegisterView = () => import('@/views/auth/RegisterView.vue');

const FeedView = () => import('@/views/FeedView.vue');
const DiscoverView = () => import('@/views/DiscoverView.vue');
const CreatePostView = () => import('@/views/CreatePostView.vue');
const ProfileView = () => import('@/views/ProfileView.vue');
const EditProfileView = () => import('@/views/EditProfileView.vue');
const ConnectionsListView = () => import('@/views/ConnectionsListView.vue');
const PostDetailView = () => import('@/views/PostDetailView.vue');

const AuthLayout = () => import('@/layouts/AuthLayout.vue');
const AppLayout = () => import('@/layouts/AppLayout.vue');

import NotFoundView from '@/views/NotFoundView.vue';

const routes = [
  {
    path: '/',
    redirect: '/feed',
  },

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
        path: '/register',
        component: RegisterView,
        meta: { requiresGuest: true },
      },
    ],
  },

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
        path: '/discover',
        component: DiscoverView,
        meta: { requiresAuth: true },
      },
      {
        path: '/create',
        component: CreatePostView,
        meta: { requiresAuth: true },
      },
      {
        path: '/profile',
        component: ProfileView,
        meta: { requiresAuth: true },
      },
      {
        path: '/profile/edit',
        component: EditProfileView,
        meta: { requiresAuth: true },
      },
      {
        path: '/profile/list/:type',
        component: ConnectionsListView,
        meta: { requiresAuth: true },
        beforeEnter: (to) => {
          if (!['followers', 'following'].includes(String(to.params.type || ''))) {
            return '/profile';
          }
          return true;
        },
      },
      {
        path: '/posts/:postId',
        component: PostDetailView,
        meta: { requiresAuth: true },
      },
    ],
  },

  {
    path: '/:pathMatch(.*)*',
    component: NotFoundView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

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