
# Documentação Técnica — Clínica Escola Odonto
### Grupo 3
## Sumário

- [Visão Geral](#visão-geral)
- [Estrutura de Pastas e Arquivos](#estrutura-de-pastas-e-arquivos)
- [Backend (Node.js)](#backend-nodejs)
   - [server.js](#serverjs)
   - [server-backup.js](#server-backupjs)
   - [server-test.js](#server-testjs)
- [Frontend (public/)](#frontend-public)
   - [index.html](#indexhtml)
   - [script.js](#scriptjs)
   - [style.css](#stylecss)
- [Testes e Utilitários](#testes-e-utilitários)
   - [test-chat.html](#test-chathtml)
- [Dependências](#dependências)
- [Fluxo de Dados](#fluxo-de-dados)
- [API Endpoints](#api-endpoints)
- [Assistente IA (Google Gemini)](#assistente-ia-google-gemini)
- [Temas e Acessibilidade](#temas-e-acessibilidade)
- [Como Executar](#como-executar)
- [Licença](#licença)

---

## Visão Geral

Sistema web para gestão de clínica escola odontológica, com cadastro e busca de pacientes, prontuário digital, integração com API externa (TISAUDE), assistente IA (Google Gemini) e interface moderna responsiva.

---

## Estrutura de Pastas e Arquivos

```
clinica-escola-odonto/
├── package.json
├── server.js
├── server-backup.js
├── server-test.js
├── test-chat.html
├── public/
│   ├── index.html
│   ├── script.js
│   └── style.css
```

---

## Backend (Node.js)

### server.js

- **Framework:** Express.js
- **Principais funções:**
   - Servir arquivos estáticos da pasta `public/`
   - Middleware para CORS e JSON
   - Integração com API TISAUDE (cadastro, busca, timeline e fichas de pacientes)
   - Simulação de dados de usuário local
   - API para atualização e consulta de dados do usuário
   - API de chat com assistente IA (Google Gemini)
   - Utiliza EventEmitter para simular workers/consumers
- **Endpoints principais:**
   - `GET /api/health` — status do servidor
   - `POST /api/pacientes` — cadastro de paciente
   - `GET /api/pacientes` — busca de pacientes
   - `GET /api/pacientes/:id` — detalhes do paciente
   - `GET /api/pacientes/:id/timeline` — histórico detalhado
   - `GET /api/pacientes/:id/fichas` — fichas/anamnese
   - `GET /api/user` e `PUT /api/user` — dados/configuração do usuário
   - `POST /api/chat` — integração com Gemini IA

### server-backup.js

- Versão alternativa do servidor principal, focado em chat IA.
- Porta padrão: 3001
- Responde apenas ao chat e teste de servidor.
- Utiliza instruções de formatação Markdown para respostas do Gemini.

### server-test.js

- Similar ao backup, focado em testes do chat IA.
- Porta padrão: 3001
- Utiliza contexto odontológico para o Gemini.

---

## Frontend (public/)

### index.html

- Interface SPA (Single Page Application) com navegação por views.
- Utiliza Bootstrap 5 e Bootstrap Icons.
- Principais seções:
   - Dashboard
   - Agenda do dia
   - Busca e cadastro de pacientes
   - Detalhes do paciente (prontuário digital)
   - Configurações do usuário
   - Chat com assistente IA
- Componentes dinâmicos e responsivos.
- Estatísticas e acesso rápido na sidebar.

### script.js

- Gerencia navegação entre views.
- Busca, cadastro e detalhamento de pacientes via API.
- Atualização de configurações do usuário.
- Gerenciamento de tema (claro/escuro/auto).
- Integração com chat IA, renderizando respostas em Markdown.
- Funções para manipulação do DOM, eventos, e comunicação com backend.

### style.css

- Estilos customizados para views, cards, sidebar, chat, tabelas, temas.
- Suporte completo a tema escuro via `[data-theme="dark"]`.
- Animações para transições e chat.
- Estilização para conteúdo Markdown renderizado no chat.

---

## Testes e Utilitários

### test-chat.html

- Página simples para testar o endpoint `/api/chat`.
- Envia mensagem de teste e exibe resposta JSON.

---

## Dependências

- express
- cors
- axios
- dotenv
- @google/generative-ai
- marked (renderização Markdown)
- bootstrap (frontend)
- bootstrap-icons

---

## Fluxo de Dados

1. Usuário interage via interface web (`index.html`).
2. Requisições AJAX são feitas para o backend (`server.js`).
3. Backend processa dados, integra com API TISAUDE e Gemini IA.
4. Respostas são renderizadas dinamicamente no frontend.
5. Chat IA utiliza Markdown para formatação técnica.

---

## API Endpoints

| Método | Rota                              | Descrição                                 |
|--------|-----------------------------------|-------------------------------------------|
| GET    | /api/health                      | Status do servidor                        |
| POST   | /api/pacientes                   | Cadastro de paciente                      |
| GET    | /api/pacientes                   | Busca de pacientes                        |
| GET    | /api/pacientes/:id               | Detalhes do paciente                      |
| GET    | /api/pacientes/:id/timeline      | Histórico detalhado do paciente           |
| GET    | /api/pacientes/:id/fichas        | Fichas/anamnese do paciente               |
| GET    | /api/user                        | Dados do usuário                          |
| PUT    | /api/user                        | Atualização de dados do usuário           |
| POST   | /api/chat                        | Chat com assistente IA (Google Gemini)    |

---

## Assistente IA (Google Gemini)

- Utiliza API do Google Gemini para respostas técnicas odontológicas.
- Contexto customizado para clínica escola.
- Respostas formatadas em Markdown.
- Instruções para formatação e conteúdo garantem clareza e didática.

---

## Temas e Acessibilidade

- Suporte a tema claro, escuro e automático.
- Estilos responsivos e acessíveis.
- Preferências de tema salvas em localStorage e backend.

---

## Como Executar

1. Instale as dependências:
    ```powershell
    npm install
    ```
2. Configure a variável de ambiente `GEMINI_API_KEY` no arquivo `.env`.
3. Inicie o servidor:
    ```powershell
    node server.js
    ```
4. Acesse a interface web em `http://localhost:3000`.

---

## Licença

Projeto sob licença ISC/MIT.
