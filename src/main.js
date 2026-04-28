import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from '@/stores/auth';

import 'bootstrap/dist/css/bootstrap.min.css';

import './assets/styles/theme.css';

const app = createApp(App);

app.use(createPinia());

async function bootstrap() {

  const auth = useAuthStore();
  await auth.init();

  app.use(router);
  app.mount('#app');
}

bootstrap();