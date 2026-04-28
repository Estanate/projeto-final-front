# InstaClone (frontend) - Especificacao de build

Lista de tarefas para reconstruir o frontend. Cada item descreve comportamento esperado, endpoints consumidos e restricoes de UI. Os nomes de rota, endpoints e limites sao contratos com o backend e devem ser respeitados.

## 1 - Setup do Projeto

- [ x ] Inicializar projeto com Vue 3 + Vite
- [ x ] Estrutura de pastas por dominio: `components/`, `composables/`, `layouts/`, `router/`, `services/`, `stores/`, `views/`
- [ x ] Vue Router com rota curinga `/:pathMatch(.*)*` servindo uma view `NotFound`
- [ x ] Pinia para estado compartilhado (`auth`, `feed`)
- [ x ] Tema global em `src/assets/styles/theme.css` (importado no `main.js` apos Bootstrap)
- [ x ] Cliente axios centralizado em `src/services/api.js`:
  - baseURL lida de `import.meta.env.VITE_API_URL`
  - interceptor de request injeta `Authorization: Bearer <token>` quando existe token
  - interceptor de response trata `401`: limpa token, redireciona para `/login`
- [ ] `.env.example` com `VITE_API_URL=http://localhost:8000/api`
- [ ] `.dockerignore` excluindo `node_modules`, `dist`, `.env`, mantendo `.env.example`

## 2 - Autenticacao

- [ ] Screen `/login` with fields `email` and `password`
- [ ] Screen `/register` with fields `name`, `username`, `email`, `password`, `password_confirmation`
- [ ] Store `auth` (Pinia) com estado `user`, `token`, `isAuthenticated`, actions `login`, `register`, `logout`, `fetchMe`
- [ ] `POST /auth/login` devolve `access_token` e `user`; salvar token em `localStorage` com chave fixa (ex.: `instaclone.token`)
- [ ] `POST /auth/register` cria conta e ja autentica
- [ ] `POST /auth/logout` limpa sessao local mesmo se o token ja estiver invalido
- [ ] `GET /auth/me` hidrata o usuario atual a partir do token salvo ao entrar em rota protegida
- [ ] Guards de rota:
  - `requiresAuth`: without token, redirects to `/login`
  - `requiresGuest`: with token, redirects to `/feed`
- [ ] Mensagens de erro exibidas inline abaixo do formulario

## 3 - Layout e Navegacao

- [ ] `AuthLayout` for guest screens (`/login`, `/register`)
- [ ] `AppLayout` para area autenticada
- [ ] Shell autenticado responsivo:
  - mobile: barra de navegacao inferior fixa
  - desktop: sidebar lateral
- [ ] Navigation entries: `Home` (`/feed`), `Search` (`/discover`), `Create` (`/create`), `Profile` (`/profile`)
- [ ] `RouterView` usando `v-slot="{ Component }"` + `<component :is="Component" />` para troca de views

## 4 - Feed (`/feed`)

- [ ] `GET /feed` retorna `{ items: [...], next_cursor: string|null }`
- [ ] Store `feed` normaliza os posts em um dicionario por id e mantem uma lista ordenada
- [ ] Actions do store: `fetchFeed`, `loadMoreFeed(cursor)`, `toggleLike(postId)`, `addComment(postId, body)`, `createPost(formData)`
- [ ] Botao "carregar mais" visivel enquanto `next_cursor !== null`
- [ ] Card de post exibe:
  - avatar + username of author (link to `/profile?user=<username>`)
  - imagem do post
  - contador de curtidas e botao de like
  - legenda
  - data relativa (ex.: "ha 2h")
  - contador de comentarios
  - campo inline para adicionar comentario
- [ ] Curtir: `POST /posts/:id/like`. Descurtir: `DELETE /posts/:id/unlike`. Atualizar contador de forma otimista
- [ ] Comentar inline: `POST /posts/:id/comments` com `{ body }`

## 5 - Discover (`/discover`)

- [ ] `GET /users/suggestions` lista perfis sugeridos
- [ ] `GET /users/:viewerId/following` carrega quem o viewer ja segue para marcar o estado do botao
- [ ] Botao "Seguir" / "Seguindo" por card
  - seguir: `POST /users/:id/follow`
  - deixar de seguir: `DELETE /users/:id/follow`
- [ ] Click on card opens `/profile?user=<username>` or `/profile` if it's oneself
- [ ] Paginacao por pagina (`?page=<n>`)

## 6 - Create Post (`/create`)

- [ ] Input `<input type="file">` aceita apenas `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- [ ] Limite de 5 MB (validar no cliente antes do upload)
- [ ] Preview local com `URL.createObjectURL`; revogar o blob ao trocar imagem, limpar ou desmontar
- [ ] Campo de legenda com limite de `2200` caracteres e contador visivel
- [ ] Botao de publicar desabilitado enquanto imagem ou legenda estao ausentes
- [ ] `POST /posts` com `FormData` contendo `image` e `caption`
- [ ] Exibir feedback de sucesso (redirecionar para `/feed`) e mensagens de erro

## 7 - Profile (`/profile` and `/profile?user=<username>`)

- [ ] `GET /users/{username}` resolve o perfil alvo
- [ ] Em paralelo, carregar:
  - `GET /users/{id}/posts` (grid de posts)
  - `GET /users/{id}/followers` (contador)
  - `GET /users/{id}/following` (contador)
- [ ] Para perfis de terceiros, consultar `GET /users/{id}/is-following` para decidir o estado do botao
- [ ] Acoes:
  - seguir: `POST /users/:id/follow`
  - deixar de seguir: `DELETE /users/:id/follow`
- [ ] Button "Edit profile" appears only on own profile and leads to `/profile/edit`
- [ ] Followers and following counters lead to `/profile/list/followers` and `/profile/list/following` (preserving `?user=` when it's a third-party profile)
- [ ] Grid de posts: clicar em um post abre `/posts/:postId`

## 7.1 - Edit Profile (`/profile/edit`)

- [ ] `PUT /users/me` com `{ name, username, bio }`
- [ ] `POST /users/me/avatar` com `FormData` contendo `avatar`
- [ ] Limites validados no cliente:
  - `name`: 255 caracteres
  - `username`: 30 caracteres, regex `^[A-Za-z0-9._]+$`
  - `bio`: 500 caracteres
  - avatar: 2 MB
- [ ] Mensagens de erro por campo vindas do backend

## 8 - Connection Lists (`/profile/list/:type`)

- [ ] `:type` accepts `followers` or `following`
- [ ] Respeita `?user=<username>` para listar conexoes de outro perfil
- [ ] `GET /users/{id}/followers` e `GET /users/{id}/following` com paginacao por pagina
- [ ] Cada linha mostra avatar, nome, username e botao de seguir / deixar de seguir
- [ ] Button to go back to the origin profile

## 9 - Detalhes do Post (`/posts/:postId`)

- [ ] `GET /posts/:id` carrega o post
- [ ] `GET /posts/:id/comments` carrega comentarios com paginacao por pagina
- [ ] Botao "carregar mais" para comentarios
- [ ] Campo para adicionar comentario: `POST /posts/:id/comments`
- [ ] `DELETE /comments/:id` disponivel apenas para o autor do comentario
- [ ] `DELETE /posts/:id` disponivel apenas para o autor do post; redireciona para `/feed` apos sucesso
- [ ] Contadores de curtidas e comentarios vem do payload do backend

## 10 - 404

- [ ] View `NotFound` com link para `/feed` (autenticado) ou `/login` (visitante)

## 11 - Docker e Entrega

- [ ] `Dockerfile` multi-stage:
  - stage `build`: `node:22-alpine`, roda `npm ci` e `npm run build`
  - stage runtime: `nginx:1.27-alpine` servindo `/usr/share/nginx/html`
- [ ] `docker/nginx.conf` com `try_files $uri $uri/ /index.html` para o history mode do Vue Router
- [ ] `compose.yaml` expondo `3000:80` e passando `VITE_API_URL` como build-arg
- [ ] `.dockerignore` excluindo `node_modules`, `dist`, `.env`, preservando `.env.example`
- [ ] `npm run build` gera bundle de producao em `dist/`

## Endpoints consumidos (resumo)

| Recurso | Metodo | Rota |
| --- | --- | --- |
| Auth | POST | `/auth/login` |
| Auth | POST | `/auth/register` |
| Auth | POST | `/auth/logout` |
| Auth | GET | `/auth/me` |
| Feed | GET | `/feed?cursor=<c>` |
| Posts | POST | `/posts` (multipart) |
| Posts | GET | `/posts/:id` |
| Posts | DELETE | `/posts/:id` |
| Posts | POST | `/posts/:id/like` |
| Posts | DELETE | `/posts/:id/unlike` |
| Comments | GET | `/posts/:id/comments` |
| Comments | POST | `/posts/:id/comments` |
| Comments | DELETE | `/comments/:id` |
| Users | GET | `/users/suggestions` |
| Users | GET | `/users/:username` |
| Users | GET | `/users/:id/posts` |
| Users | GET | `/users/:id/followers` |
| Users | GET | `/users/:id/following` |
| Users | GET | `/users/:id/is-following` |
| Users | POST | `/users/:id/follow` |
| Users | DELETE | `/users/:id/follow` |
| Users | PUT | `/users/me` |
| Users | POST | `/users/me/avatar` (multipart) |