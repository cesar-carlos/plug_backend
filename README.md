# plug_backend

Backend API REST e Socket.io server construído com Bun, Elysia e Clean Architecture.

## 🚀 Início Rápido

### Pré-requisitos

- [Bun](https://bun.sh) v1.3.6 ou superior

### Instalação

```bash
# Instalar dependências
bun install
```

### Configuração

1. Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente no arquivo `.env`:

```env
JWT_SECRET=your-secret-key-here-change-in-production
CORS_ORIGIN=*
PORT=3000
LOG_LEVEL=info
NODE_ENV=development
DEFAULT_ADMIN_PASSWORD=admin
```

### Executar em Desenvolvimento

```bash
# Modo desenvolvimento
bun run dev

# Ou
bun run start
```

O servidor estará disponível em:

- **API REST**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/documentation
- **Socket.io**: ws://localhost:3000

## 📋 Scripts Disponíveis

```bash
# Desenvolvimento
bun run dev          # Inicia o servidor em modo desenvolvimento

# Testes
bun test            # Executa todos os testes
bun test:watch      # Executa testes em modo watch
bun test:coverage   # Executa testes com cobertura
```

## 🏗️ Estrutura do Projeto

```
src/
├── domain/              # Camada de domínio (entities, use cases, repositories)
├── application/         # Camada de aplicação (services, DTOs)
├── infrastructure/      # Camada de infraestrutura (implementações)
├── presentation/        # Camada de apresentação (controllers, handlers)
├── shared/              # Utilitários compartilhados
├── plugins/            # Plugins do Elysia
├── app.ts              # Configuração do Elysia
├── socket.ts           # Configuração do Socket.io
└── index.ts            # Entry point
```

## 🔐 Autenticação

O projeto usa JWT para autenticação. Para fazer login:

```bash
POST /auth/login
{
  "username": "admin",
  "password": "admin"  # ou o valor de DEFAULT_ADMIN_PASSWORD
}
```

## 📡 Socket.io

O servidor Socket.io está configurado com compressão automática. Eventos disponíveis:

- `chat:message` - Enviar mensagem de chat
- `chat:response` - Receber resposta do servidor
- `error` - Receber erros

## 🧪 Testes

```bash
# Executar todos os testes
bun test

# Executar testes em modo watch
bun test:watch

# Executar testes com cobertura
bun test:coverage
```

## 📚 Documentação

- **Swagger UI**: http://localhost:3000/swagger (quando o servidor estiver rodando)
- **Arquitetura**: Ver `.agent/rules/architecture.md`
