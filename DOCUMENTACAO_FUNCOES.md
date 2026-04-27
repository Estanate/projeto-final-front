# 📱 Documentação Completa - Projeto InstaClone

## Índice
1. [Visão Geral do Projeto](#visão-geral)
2. [Estrutura de Arquivos](#estrutura-arquivos)
3. [Autenticação](#autenticação)
4. [Feed de Postagens](#feed)
5. [Serviço de API](#serviço-de-api)
6. [Utilitários](#utilitários)
7. [Roteamento](#roteamento)
8. [Componentes](#componentes)
9. [Funcionalidades Principais](#funcionalidades-principais)

---

## <a name="visão-geral"></a>📊 Visão Geral do Projeto

**InstaClone** é uma rede social desenvolvida com **Vue 3** que permite aos usuários:
- Criar e compartilhar postagens com imagens
- Curtir e comentar em postagens
- Seguir/deixar de seguir outros usuários
- Descobrir novos usuários
- Editar perfil pessoal
- Ver perfis de outros usuários

### Tecnologias Utilizadasii
- **Framework**: Vue 3 com Composition API
- **Gerenciamento de Estado**: Pinia
- **Roteamento**: Vue Router
- **HTTP**: Axios com interceptadores de autenticação
- **Estilização**: Bootstrap 5 + CSS customizado
- **Build**: Vite

---

## <a name="estrutura-arquivos"></a>📁 Estrutura de Arquivos

### **Raiz do Projeto**
```
├── compose.yaml          # Configuração Docker Compose (orquestração de containers)
├── Dockerfile            # Configuração para build da imagem Docker
├── package.json          # Dependências do Node.js
├── vite.config.js        # Configuração do Vite (bundler)
├── jsconfig.json         # Configuração de paths e alias do JavaScript
├── index.html            # HTML principal
├── README.md             # Documentação do projeto
└── docker/
    └── nginx.conf        # Configuração do servidor Nginx (produção)
```

---

### **📂 src/ - Código da Aplicação**

#### **`src/main.js`**
- Arquivo de entrada da aplicação Vue
- Inicializa o Vue, Router e Pinia

#### **`src/App.vue`**
- Componente raiz
- Renderiza as views baseado nas rotas

---

### **🎨 src/assets/ - Recursos Estáticos**
```
assets/
└── styles/
    └── theme.css       # Estilos globais da aplicação
```

---

### **🧩 src/components/ - Componentes Reutilizáveis**
```
components/
├── Navbar.vue          # Barra de navegação principal
└── ui/                 # Componentes UI genéricos
    ├── Avatar.vue      # Exibe avatar do usuário
    ├── ConfirmModal.vue # Modal de confirmação
    └── Spinner.vue     # Animação de carregamento
```

---

### **🎭 src/layouts/ - Layouts Principais**
```
layouts/
├── AppLayout.vue       # Layout para usuários autenticados (com Navbar)
└── AuthLayout.vue      # Layout para login/cadastro (sem Navbar)
```

---

### **🌐 src/router/ - Roteamento**
```
router/
└── index.js           # Definição de todas as rotas da aplicação
```
**Inclui:**
- Rotas públicas (login, cadastro)
- Rotas protegidas (feed, perfil, etc)
- Guards de autenticação

---

### **🔌 src/services/ - Integração com API**
```
services/
└── api.js             # Cliente HTTP com Axios
```
**Características:**
- Interceptadores para adicionar token automaticamente
- Tratamento de erro 401 (sessão expirada)

---

### **💾 src/stores/ - Gerenciamento de Estado (Pinia)**
```
stores/
├── auth.js            # Estado de autenticação
│   ├── login()
│   ├── register()
│   ├── logout()
│   ├── fetchMe()
│   └── isAuthenticated (getter)
│
└── feed.js            # Estado do feed de postagens
    ├── fetchFeed()
    ├── toggleLike()
    ├── addComment()
    ├── createPost()
    └── removePost()
```

---

### **🛠️ src/utils/ - Funções Utilitárias**
```
utils/
├── date.js            # timeAgo() - converte datas em formato relativo
│                      # Ex: "há 5 min", "há 2h", "há 3 dias"
│
└── format.js          # formatCount() - abreviar números
                       # Ex: 1500 → "1.5k", 2300000 → "2.3M"
```

---

### **📄 src/views/ - Páginas da Aplicação**
```
views/
├── FeedView.vue           # Feed principal (lista de posts)
├── DescubrirView.vue      # Descobrir novos usuários
├── CriarPostView.vue      # Criar nova postagem
├── PerfilView.vue         # Perfil de usuário
├── EditarPerfilView.vue   # Editar dados do perfil
├── PostDetailView.vue     # Detalhes de uma postagem (+ comentários)
├── ListaConexoesView.vue  # Lista de seguidores/seguindo
├── NotFoundView.vue       # Página 404
│
└── auth/                  # Views de autenticação
    ├── LoginView.vue      # Página de login
    └── CadastroView.vue   # Página de cadastro
```

---

### **🏗️ Fluxo de Dados**

```
Views (páginas)
    ↓
    ├→ Chamam actions do Store (Pinia)
    │
    └→ O Store chama a API (services/api.js)
        ↓
        API retorna dados
        ↓
        Store armazena em estado reativo
        ↓
        Components reagem e atualizam UI
```

---

### **📊 Organização por Funcionalidade**

| Pasta | Responsabilidade | Exemplos |
|-------|------------------|----------|
| **views/** | Páginas completas | Feed, Perfil, Login |
| **components/** | Componentes reutilizáveis | Navbar, Avatar, Modal |
| **stores/** | Lógica de negócio + estado | Autenticação, Feed |
| **services/** | Comunicação com API | Requisições HTTP |
| **router/** | Navegação entre páginas | Rotas, Guards |
| **utils/** | Funções auxiliares | Formatações, Datas |
| **layouts/** | Estrutura das páginas | Com/sem Navbar |

---

### **🎯 Padrão Arquitetural**

Esse projeto segue o padrão **Component-Based Architecture** com:
- ✅ **Separation of Concerns** (cada pasta tem responsabilidade clara)
- ✅ **Reusability** (componentes reutilizáveis)
- ✅ **Scalability** (fácil adicionar novas features)
- ✅ **State Management** (Pinia centraliza estado)
- ✅ **API Abstraction** (API service isola requisições HTTP)

---

## <a name="autenticação"></a>🔐 Autenticação (stores/auth.js)

### Função: `init()`
**O que faz**: Restaura a sessão do usuário quando a aplicação inicia.
**Como funciona**:
- Verifica se existe um token salvo no localStorage
- Valida o token
- Se válido, restaura os dados do usuário na memória
- Se inválido, limpa a sessão

**Quando é chamada**: Na inicialização da aplicação (main.js)

---

### Função: `login(email, password)`
**O que faz**: Realiza login do usuário.
**Parâmetros**:
- `email`: Email do usuário
- `password`: Senha do usuário

**Como funciona**:
- Envia credenciais para a API (`POST /login`)
- Recebe token de autenticação
- Armazena token no localStorage
- Salva dados do usuário em memória
- Retorna dados do usuário autenticado

**Quando é chamada**: Quando usuário clica em "Entrar" na página de login

---

### Função: `register(name, username, email, password, password_confirmation)`
**O que faz**: Cria uma nova conta de usuário.
**Parâmetros**:
- `name`: Nome completo
- `username`: Nome de usuário (único)
- `email`: Email (único)
- `password`: Senha
- `password_confirmation`: Confirmação da senha

**Como funciona**:
- Envia dados para a API (`POST /register`)
- Se sucesso, realiza login automático
- Armazena token e dados do usuário

**Quando é chamada**: Quando usuário clica em "Criar Conta" na página de cadastro

---

### Função: `logout()`
**O que faz**: Desconecta o usuário.
**Como funciona**:
- Remove token do localStorage
- Limpa dados do usuário em memória
- Redireciona para página de login

**Quando é chamada**: Quando usuário clica em "Sair" na Navbar

---

### Função: `fetchMe()`
**O que faz**: Busca dados atualizados do usuário logado.
**Como funciona**:
- Faz requisição GET para `/users/me` na API
- Atualiza dados do usuário em memória
- Retorna os dados do usuário

**Quando é chamada**: Quando é necessário sincronizar dados do usuário com o servidor

---

### Função: `updateProfile(data)`
**O que faz**: Atualiza dados do perfil do usuário localmente.
**Parâmetros**:
- `data`: Objeto com campos a atualizar (nome, bio, etc)

**Como funciona**:
- Atualiza dados em memória imediatamente (otimista)
- Permite interface responsiva

**Quando é chamada**: Após editar perfil com sucesso

---

### Getter: `isAuthenticated`
**O que faz**: Verifica se usuário está autenticado.
**Retorna**: `true` se token existe, `false` caso contrário

**Uso**:
```javascript
if (auth.isAuthenticated) {
  // Usuário logado
}
```

---

## <a name="feed"></a>📰 Feed de Postagens (stores/feed.js)

### Função: `fetchFeed()`
**O que faz**: Carrega o feed de postagens do usuário.
**Como funciona**:
- Faz requisição GET para `/feed` na API
- Recebe lista de postagens
- Normaliza os dados (padroniza formato)
- Hidrata comentários
- Salva em cache no localStorage para acesso offline
- Armazena em memória

**Quando é chamada**: Quando usuário acessa a página inicial (Feed)

---

### Função: `loadMoreFeed()`
**O que faz**: Carrega mais postagens (paginação).
**Como funciona**:
- Busca próxima página usando cursor
- Adiciona novas postagens ao feed existente
- Atualiza cache

**Quando é chamada**: Quando usuário faz scroll até o final da página

---

### Função: `toggleLike(postId)`
**O que faz**: Curte ou descurte uma postagem.
**Parâmetros**:
- `postId`: ID da postagem

**Como funciona**:
- Atualiza interface imediatamente (otimista)
- Envia requisição para API (`POST /posts/{id}/like` ou DELETE)
- Se erro, desfaz a alteração na interface

**Quando é chamada**: Quando usuário clica no ícone de coração em uma postagem

---

### Função: `addComment(postId, body)`
**O que faz**: Adiciona um comentário em uma postagem.
**Parâmetros**:
- `postId`: ID da postagem
- `body`: Texto do comentário

**Como funciona**:
- Envia comentário para API (`POST /posts/{id}/comments`)
- Se sucesso, adiciona comentário ao feed local
- Se erro, mostra mensagem de erro

**Quando é chamada**: Quando usuário escreve um comentário e clica em enviar

---

### Função: `createPost(formData)`
**O que faz**: Cria uma nova postagem.
**Parâmetros**:
- `formData`: Objeto com:
  - `caption`: Texto da postagem
  - `image`: Arquivo de imagem

**Como funciona**:
- Envia FormData para API (`POST /posts`)
- Se sucesso, adiciona postagem ao início do feed
- Limpa formulário

**Quando é chamada**: Quando usuário clica em "Publicar" ao criar postagem

---

### Função: `removePost(postId)`
**O que faz**: Remove uma postagem do feed.
**Parâmetros**:
- `postId`: ID da postagem a remover

**Como funciona**:
- Remove da memória (estado)
- Remove do cache do localStorage

**Quando é chamada**: Quando postagem é deletada pelo usuário

---

### Função: `normalizePost(post)`
**O que faz**: Padroniza o formato de uma postagem.
**Como funciona**:
- Lida com variações de formato da API
- Normaliza campos de curtidas, comentários, usuário
- Retorna postagem em formato padrão

**Por que é necessária**: A API pode retornar dados em diferentes formatos, então precisa padronizar

**Exemplos de formatos tratados**:
```javascript
// Diferentes formas que curtidas podem vir:
post.likes_count
post.likesCount
post.likeCount

// Diferentes formas de comentários:
post.comments
post.payload.comments
post.items
```

---

### Função: `normalizeComment(comment)`
**O que faz**: Padroniza o formato de um comentário.
**Como funciona**: Similar a `normalizePost`, ajusta variações de formato

---

### Função: `loadFeedFromStorage()`
**O que faz**: Restaura feed do cache do localStorage.
**Como funciona**:
- Verifica se existe feed salvo no localStorage
- Carrega para memória se existir
- Útil para acesso offline

**Quando é chamada**: Durante inicialização da aplicação

---

### Função: `saveFeedToStorage()`
**O que faz**: Salva feed atual no localStorage.
**Como funciona**:
- Converte feed para JSON
- Armazena no localStorage
- Permite acesso offline

**Quando é chamada**: Após cada modificação do feed

---

### Função: `fetchCommentsForPost(postId)`
**O que faz**: Busca comentários de uma postagem específica.
**Parâmetros**:
- `postId`: ID da postagem

**Como funciona**:
- Faz requisição para API (`GET /posts/{id}/comments`)
- Normaliza comentários
- Retorna lista de comentários

**Quando é chamada**: Ao abrir detalhes de uma postagem

---

## <a name="serviço-de-api"></a>🌐 Serviço de API (services/api.js)

### Interceptador de Requisição
**O que faz**: Adiciona token de autenticação automaticamente em todas as requisições.
**Como funciona**:
- Antes de cada requisição, verifica se existe token no localStorage
- Adiciona header `Authorization: Bearer {token}` automaticamente
- Usuário não precisa fazer isso manualmente

**Benefício**: Simplifica código, evita esquecer de adicionar token

---

### Interceptador de Resposta
**O que faz**: Trata erros de autenticação automaticamente.
**Como funciona**:
- Se servidor retorna erro 401 (não autorizado):
  - Remove token do localStorage
  - Redireciona para página de login
  - Força novo login

**Benefício**: Sessão expirada é tratada automaticamente

---

### Métodos HTTP Disponíveis

#### `api.get(url)`
**O que faz**: Busca dados do servidor (requisição GET).
**Exemplo**:
```javascript
const users = await api.get('/users/suggestions')
```

#### `api.post(url, data)`
**O que faz**: Envia dados para servidor (requisição POST).
**Exemplo**:
```javascript
await api.post('/posts', formData)
```

#### `api.put(url, data)`
**O que faz**: Atualiza dados no servidor (requisição PUT).
**Exemplo**:
```javascript
await api.put('/users/me', profileData)
```

#### `api.delete(url)`
**O que faz**: Deleta dados no servidor (requisição DELETE).
**Exemplo**:
```javascript
await api.delete('/posts/123')
```

---

## <a name="utilitários"></a>🕐 Utilitários

### Função: `timeAgo(dateString)` (utils/date.js)
**O que faz**: Converte data para formato relativo.
**Parâmetros**:
- `dateString`: Data em formato string (exemplo: "2024-01-15T10:30:00")

**Retorna**:
- "agora" - postado há menos de 1 minuto
- "há 5 min" - postado há 5 minutos
- "há 2h" - postado há 2 horas
- "há 3 dias" - postado há 3 dias
- Data completa - se mais antigo que 30 dias

**Exemplo de uso**:
```javascript
// Resultado: "há 2h"
<p>{{ timeAgo(post.created_at) }}</p>
```

**Por que é útil**: Mostra tempo de forma natural ("há 5 min" é mais intuitivo que "2024-01-15 10:30:00")

---

### Função: `formatCount(n)` (utils/format.js)
**O que faz**: Abreviar números grandes.
**Parâmetros**:
- `n`: Número a formatar

**Retorna**:
- "1.5k" - para 1500
- "2.3M" - para 2.3 milhões
- "1B" - para 1 bilhão
- Número normal para valores pequenos

**Exemplo de uso**:
```javascript
// Se 1500 curtidas, mostra: "1.5k"
<p>{{ formatCount(post.likes_count) }} curtidas</p>
```

**Por que é útil**: Economiza espaço na interface, números grandes ficam legíveis

---

## <a name="roteamento"></a>🗺️ Roteamento (router/index.js)

### Rotas da Aplicação

| Rota | Nome | Tipo | Layout | Descrição |
|------|------|------|--------|-----------|
| `/` | home | - | - | Redireciona para `/feed` |
| `/login` | login | Público | AuthLayout | Página de login |
| `/cadastro` | cadastro | Público | AuthLayout | Página de cadastro |
| `/feed` | feed | Protegido | AppLayout | Feed de postagens |
| `/descobrir` | descobrir | Protegido | AppLayout | Descobrir novos usuários |
| `/criar` | criar | Protegido | AppLayout | Criar nova postagem |
| `/perfil` | perfil | Protegido | AppLayout | Perfil do usuário logado |
| `/perfil/editar` | editarPerfil | Protegido | AppLayout | Editar perfil |
| `/perfil/lista/:type` | lista | Protegido | AppLayout | Lista de seguidores/seguindo |
| `/posts/:postId` | postDetail | Protegido | AppLayout | Detalhes da postagem |
| `/:pathMatch` | - | - | - | Página 404 (não encontrada) |

---

### Guard de Autenticação (`beforeEach`)
**O que faz**: Verifica permissões antes de acessar rota.
**Como funciona**:
- Se rota requer autenticação e usuário não está logado → redireciona para login
- Se rota é apenas para visitantes (login/cadastro) e usuário já logou → redireciona para feed
- Se usuário logado quer acessar login → vai para feed

**Exemplo**:
- Usuário não logado tenta acessar `/feed` → redireciona para `/login`
- Usuário logado tenta acessar `/login` → redireciona para `/feed`

---

### Guard de Lista (`beforeEnter`)
**O que faz**: Valida parâmetro na rota `/perfil/lista/:type`.
**Como funciona**:
- Verifica se `type` é 'seguidores' ou 'seguindo'
- Se inválido, redireciona para perfil

**Exemplo**:
- `/perfil/lista/seguidores` ✅ Válido
- `/perfil/lista/amigos` ❌ Inválido, redireciona para perfil

---

## <a name="componentes"></a>🎨 Componentes Vue

### Navbar.vue (components/Navbar.vue)

#### Função: `handleLogout()`
**O que faz**: Realiza logout do usuário.
**Como funciona**:
- Chama `auth.logout()` do store de autenticação
- Navega para página de login
- Remove token do localStorage

**Quando é chamada**: Quando usuário clica em "Sair" na Navbar

#### Navegação
A Navbar exibe links para:
- 🏠 Home (Feed)
- 🔍 Descobrir
- ➕ Criar postagem
- 👤 Perfil
- 🚪 Sair

---

### LoginView.vue (views/auth/LoginView.vue)

#### Função: `handleSubmit()`
**O que faz**: Realiza login do usuário.
**Parâmetros recebidos do formulário**:
- Email do usuário
- Senha do usuário

**Como funciona**:
- Valida se email e senha estão preenchidos
- Chama `auth.login()` com as credenciais
- Se sucesso, redireciona para `/feed`
- Se erro, exibe mensagem de erro

**Validações**:
- Email não pode estar vazio
- Senha não pode estar vazia

---

### CadastroView.vue (views/auth/CadastroView.vue)

#### Função: `validate()`
**O que faz**: Valida dados de cadastro.
**Valida**:
- Nome não vazio
- Username não vazio e válido
- Email válido (formato correto)
- Senha com mínimo de caracteres
- Confirmação de senha igual à senha

**Retorna**: `true` se tudo válido, `false` caso contrário

---

#### Função: `handleSubmit()`
**O que faz**: Realiza cadastro do novo usuário.
**Parâmetros recebidos**:
- Nome completo
- Username (nome de usuário único)
- Email
- Senha
- Confirmação de senha

**Como funciona**:
- Valida todos os campos
- Se válido, chama `auth.register()` com os dados
- Se sucesso:
  - Usuário é automaticamente logado
  - Redireciona para `/feed`
- Se erro, exibe mensagem de erro do servidor

---

### FeedView.vue (views/FeedView.vue)

#### Função: `handleLike(postId)`
**O que faz**: Curte ou descurte uma postagem.
**Parâmetro**:
- `postId`: ID da postagem

**Como funciona**:
- Chama `feed.toggleLike(postId)`
- Interface atualiza imediatamente (otimista)
- Se erro na API, desfaz alteração

---

#### Função: `handleComment(postId)`
**O que faz**: Adiciona comentário em uma postagem.
**Parâmetro**:
- `postId`: ID da postagem
- Texto do comentário (do formulário)

**Como funciona**:
- Chama `feed.addComment(postId, texto)`
- Adiciona comentário à postagem
- Limpa campo de texto
- Se erro, exibe mensagem

---

#### Recursos
- Exibe posts com:
  - Autor (nome e avatar)
  - Imagem da postagem
  - Número de curtidas
  - Lista de comentários
  - Opção de curtir
  - Campo para adicionar comentário
- Paginação automática ao scroll

---

### DescubrirView.vue (views/DescubrirView.vue)

#### Função: `fetchSuggestions()`
**O que faz**: Busca sugestões de usuários para seguir.
**Como funciona**:
- Faz requisição para `/users/suggestions`
- Recebe lista de usuários
- Carrega com paginação
- Cada página tem novos usuários sugeridos

**Quando é chamada**: Ao carregar página de Descobrir

---

#### Função: `fetchFollowing()`
**O que faz**: Carrega lista de usuários que o usuário logado já segue.
**Como funciona**:
- Faz requisição para API
- Armazena em memória
- Usado para saber quem já está sendo seguido

**Quando é chamada**: Ao carregar página de Descobrir

---

#### Função: `toggleFollow(user)`
**O que faz**: Segue ou deixa de seguir um usuário.
**Parâmetro**:
- `user`: Objeto do usuário

**Como funciona**:
- Se ainda não segue → faz requisição para seguir
- Se já segue → faz requisição para deixar de seguir
- Atualiza interface imediatamente
- Atualiza lista local de seguindo

---

#### Função: `openProfile(user)`
**O que faz**: Abre o perfil de um usuário.
**Parâmetro**:
- `user`: Objeto do usuário

**Como funciona**:
- Navega para `/perfil` passando o username
- Mostra perfil público do usuário

---

### CriarPostView.vue (views/CriarPostView.vue)

#### Função: `handleFileChange(event)`
**O que faz**: Processa seleção de imagem para postagem.
**Como funciona**:
- Valida tamanho (máximo 5MB)
- Valida tipo (JPEG, PNG, WEBP)
- Cria preview da imagem
- Armazena arquivo temporariamente

**Validações**:
- Arquivo não pode ser maior que 5MB
- Apenas formatos de imagem aceitos

---

#### Função: `handleSubmit()`
**O que faz**: Cria nova postagem com imagem e legenda.
**Parâmetros recebidos**:
- Imagem (arquivo)
- Caption/legenda (texto)

**Como funciona**:
- Valida se imagem foi selecionada
- Valida caption (máximo 2200 caracteres)
- Cria FormData com imagem e caption
- Envia para `/posts` na API
- Se sucesso:
  - Postagem aparece no feed
  - Limpa formulário
  - Exibe mensagem de sucesso
- Se erro, exibe mensagem de erro

---

### PerfilView.vue (views/PerfilView.vue)

#### Função: `fetchProfile()`
**O que faz**: Busca dados do perfil de um usuário.
**Como funciona**:
- Faz requisição para API para dados do usuário
- Carrega simultaneamente:
  - Dados do usuário (nome, bio, avatar)
  - Posts do usuário
  - Número de seguidores
  - Número de seguindo
- Exibe tudo na interface

**Quando é chamada**: Ao acessar página de perfil

---

#### Função: `toggleFollow()`
**O que faz**: Segue ou deixa de seguir um usuário.
**Como funciona**:
- Se é o perfil do usuário logado → não mostra botão
- Se ainda não segue → segue e atualiza contador
- Se já segue → deixa de seguir e atualiza contador
- Atualiza interface otimisticamente

---

#### Função: `fetchIsFollowing()`
**O que faz**: Verifica se usuário logado segue este usuário.
**Como funciona**:
- Faz requisição para API
- Se falha, tenta alternativa (procura na lista de seguidores)
- Retorna `true` ou `false`

---

#### Função: `goToLista(type)`
**O que faz**: Navega para lista de seguidores ou seguindo.
**Parâmetro**:
- `type`: 'seguidores' ou 'seguindo'

**Como funciona**:
- Navega para `/perfil/lista/{type}`
- Passa username do usuário
- Mostra lista com avatares e nomes

---

### EditarPerfilView.vue (views/EditarPerfilView.vue)

#### Função: `handleAvatarChange(event)`
**O que faz**: Processa nova imagem de avatar.
**Como funciona**:
- Valida tamanho (máximo 2MB)
- Cria preview
- Armazena arquivo temporariamente

**Validações**:
- Máximo 2MB
- Apenas imagens

---

#### Função: `handleSubmit()`
**O que faz**: Atualiza perfil do usuário.
**Parâmetros**:
- Nome
- Username
- Bio
- Avatar (arquivo opcional)

**Como funciona**:
- Valida todos os campos
- Envia PUT request para `/users/me` com dados
- Se avatar foi selecionado, envia separadamente
- Se sucesso:
  - Atualiza dados locais
  - Exibe mensagem de sucesso
  - Redireciona para perfil
- Se erro, exibe mensagem

**Validações**:
- Username válido (sem espaços, caracteres especiais)
- Nome não vazio
- Bio máximo 500 caracteres
- Avatar máximo 2MB

---

### PostDetailView.vue (views/PostDetailView.vue)

#### Função: `fetchPost()`
**O que faz**: Carrega detalhes completos de uma postagem.
**Como funciona**:
- Faz requisição para `/posts/{id}` com timeout de 8 segundos
- Carrega primeira página de comentários
- Exibe:
  - Autor da postagem
  - Imagem
  - Caption
  - Curtidas
  - Comentários com paginação

---

#### Função: `loadCommentsPage(page, replace)`
**O que faz**: Carrega uma página específica de comentários.
**Parâmetros**:
- `page`: Número da página
- `replace`: Se `true` substitui comentários, se `false` adiciona

**Como funciona**:
- Faz requisição paginada para comentários
- Normaliza comentários
- Adiciona ou substitui comentários existentes

---

#### Função: `handleLike()`
**O que faz**: Curte ou descurte a postagem.
**Como funciona**:
- Similar a handleLike de FeedView
- Atualiza imediatamente
- Sincroniza com API

---

#### Função: `handleComment()`
**O que faz**: Adiciona novo comentário.
**Como funciona**:
- Envia comentário para API
- Recarrega todos os comentários (para sincronizar)
- Limpa campo de texto

---

#### Função: `handleDeleteComment(commentId)`
**O que faz**: Deleta um comentário.
**Parâmetro**:
- `commentId`: ID do comentário

**Como funciona**:
- Remove comentário do estado local
- Envia requisição DELETE para API
- Se erro, refaz a ação

---

#### Função: `handleDeletePost()`
**O que faz**: Deleta a postagem completamente.
**Como funciona**:
- Pede confirmação ao usuário
- Se confirma, envia requisição DELETE
- Remove postagem do feed
- Redireciona para feed principal

---

### ListaConexoesView.vue (views/ListaConexoesView.vue)

#### Função: `fetchList()`
**O que faz**: Busca lista de seguidores ou seguindo.
**Como funciona**:
- Identifica se é lista de "seguidores" ou "seguindo"
- Encontra ID do usuário pelo username
- Faz requisição com paginação
- Exibe com avatares, nomes e botões de seguir

---

#### Função: `toggleFollow(user)`
**O que faz**: Segue/deixa de seguir um usuário da lista.
**Parâmetro**:
- `user`: Usuário

**Como funciona**:
- Atualiza status de follow
- Se deixa de seguir, remove da lista
- Se segue, adiciona à lista

---

#### Função: `loadMore()`
**O que faz**: Carrega mais usuários (paginação).
**Como funciona**:
- Busca próxima página
- Adiciona usuários à lista existente

---

### Componentes UI

#### Avatar.vue (components/ui/Avatar.vue)
**O que faz**: Exibe avatar de usuário.
**Características**:
- Mostra imagem se disponível
- Mostra primeira letra do nome se não tiver imagem
- Tamanhos: pequeno, médio, grande
- Estilo customizável

**Uso**:
```javascript
<Avatar :user="user" size="lg" />
```

---

#### Spinner.vue (components/ui/Spinner.vue)
**O que faz**: Exibe animação de carregamento.
**Características**:
- Animação de rotação
- Tamanho configurável
- Cores customizáveis

**Uso**:
```javascript
<Spinner v-if="loading" size="lg" />
```

---

#### ConfirmModal.vue (components/ui/ConfirmModal.vue)
**O que faz**: Exibe modal de confirmação.
**Características**:
- Título e mensagem customizáveis
- Botões "Confirmar" e "Cancelar"
- Emite eventos `confirm` e `cancel`

**Uso**:
```javascript
<ConfirmModal 
  :show="showModal"
  title="Deletar postagem?"
  @confirm="deletePost"
  @cancel="closeModal"
/>
```

---

## <a name="funcionalidades-principais"></a>⭐ Funcionalidades Principais

### 1. **Autenticação Persistente**
- Usuário faz login uma vez
- Token é salvo no localStorage
- Na próxima visita, sessão é restaurada automaticamente
- Não precisa fazer login novamente

### 2. **Atualizações Otimistas**
- Quando usuário curte uma postagem, o coração fica vermelho **imediatamente**
- Enquanto isso, a requisição é enviada ao servidor em background
- Se falhar, volta ao estado anterior
- Resultado: interface muito responsiva e rápida

### 3. **Paginação Automática**
- Feed carrega em páginas
- Quando usuário faz scroll até o final, novas postagens são carregadas
- Funciona também em listas de comentários

### 4. **Cache Offline**
- Feed é salvo no localStorage
- Se servidor não responde, pode ver posts já carregados
- Melhora experiência em conexões lentas

### 5. **Tratamento de Erros Robusto**
- Se token expirar → força novo login
- Se falhar comentário → mostra mensagem
- Se falhar seguir → pode tentar novamente
- Interface nunca fica em estado quebrado

### 6. **Upload de Imagens**
- Valida tamanho e tipo
- Mostra preview antes de enviar
- Envia com compression automática
- Suporta: JPEG, PNG, WEBP

### 7. **Sistema de Follow Inteligente**
- Pode seguir usuários descobertos
- Pode dejar de seguir de qualquer lugar
- Contadores de seguidores/seguindo em tempo real
- Otimização: atualiza contadores sem recarregar

### 8. **Normalização de Dados Flexível**
- API pode retornar dados em diferentes formatos
- Código sempre normaliza para formato padrão
- Permite fácil integração com diferentes APIs

---

## 📌 Resumo de Fluxos Principais

### Fluxo de Login
```
Usuário clica em "Entrar"
  ↓
Valida email/senha
  ↓
Chama auth.login()
  ↓
API retorna token
  ↓
Token salvo no localStorage
  ↓
Redireciona para /feed
  ↓
Feed carregado
```

### Fluxo de Curtir Postagem
```
Usuário clica no coração
  ↓
Interface atualiza IMEDIATAMENTE (otimista)
  ↓
Requisição enviada ao servidor
  ↓
Se sucesso: pronto!
Se erro: desfaz alteração na interface
```

### Fluxo de Criar Postagem
```
Usuário seleciona imagem
  ↓
Valida tamanho (<5MB)
  ↓
Mostra preview
  ↓
Usuário escreve legenda (máx 2200 chars)
  ↓
Clica em "Publicar"
  ↓
Envia FormData (imagem + texto) para API
  ↓
Postagem aparece no topo do feed
  ↓
Formulário limpo
```

---

## 🎯 Conclusão

O InstaClone é uma aplicação moderna que demonstra:
- ✅ Gerenciamento de estado profissional (Pinia)
- ✅ Roteamento inteligente com proteção
- ✅ UX responsiva com atualizações otimistas
- ✅ Tratamento robusto de erros
- ✅ Upload de arquivos seguro
- ✅ Cache e persistência de dados
- ✅ Código bem organizado e escalável

Cada função foi pensada para tornar a experiência do usuário melhor, mais rápida e mais confiável.
