import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

// Bootstrap PRIMEIRO
import 'bootstrap/dist/css/bootstrap.min.css';

// Tema customizado DEPOIS (sobrescreve Bootstrap)
import './assets/styles/theme.css';

const app = createApp(App);

app.use(createPinia()); // Estado global centralizado
app.use(router);        // Roteamento SPA

app.mount('#app');