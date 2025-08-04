# Express-BookStack 📚

> **Microserviço Backend para Gerenciamento de Livros**  
> API RESTful robusta construída com Node.js, Express, TypeScript e MongoDB

## 🎯 **Visão Geral**

Este projeto é um **desafio técnico** que demonstra maestria em:
- **Node.js & Express** - Arquitetura escalável e moderna
- **TypeScript** - Tipagem forte e desenvolvimento seguro  
- **MongoDB & Mongoose** - Banco de dados NoSQL com ODM
- **JWT Authentication** - Sistema de autenticação seguro
- **Observabilidade** - Logs, métricas e monitoramento
- **Testes Completos** - Unitários e de integração
- **Docker** - Containerização e deploy

---

## 🏗️ **Arquitetura Backend**

### **Estrutura de Pastas**
```
src/
├── 📁 config/          # Configurações (DB, CORS, Cookies, Env)
├── 📁 controllers/     # Controladores de rotas
├── 📁 repositories/    # Camada de acesso a dados
├── 📁 services/        # Lógica de negócio
├── 📁 middlewares/     # Middlewares do Express
├── 📁 models/          # Modelos e tipos TypeScript
├── 📁 schemas/         # Validações Zod
├── 📁 routes/          # Definição de rotas
├── 📁 helpers/         # Utilitários e helpers
├── 📁 database/        # Configuração MongoDB
└── 📁 __tests__/       # Testes unitários e integração
```

### **Padrão de Arquitetura em Camadas**

**1. Routes → Controllers → Services → Repositories → Database**

```typescript
// 🔄 Fluxo de uma requisição
Request → Middleware → Route → Controller → Service → Repository → MongoDB
```

---

## 🛡️ **Sistema de Middlewares**

### **1. Error Handler Centralizado**
```typescript
// src/middlewares/errorHandler.middleware.ts
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🚨 ERRO:", err.message);
  
  if (err instanceof CustomError) {
    res.status(err.status).send(badRespObj({ message: err.message }));
  } else {
    res.status(500).send(badRespObj({ message: err.message }));
  }
};
```
**Por que usar?** Centraliza o tratamento de erros, evita duplicação de código e garante respostas consistentes.

### **2. Validação de Entrada (Zod)**
```typescript
// src/middlewares/validation.middleware.ts
const validate = (schema: ZodType, type: "body" | "params" | "query") => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req[type]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        const errMessage = extractErrorMessage(firstError);
        next(new CustomError(errMessage, 400));
      }
    }
  };
};
```

**Esquemas de Validação:**
```typescript
// src/schemas/book.schema.ts
export const bookSchema = z.object({
  isbn: z.string().trim().min(1).max(20).regex(/^[\d\-X]+$/),
  name: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(100),
  stock: z.number().int().min(0).default(0),
});

// src/schemas/bookQuery.schema.ts - Validação de query parameters
export const bookQuerySchema = z.object({
  page: z.string().optional().default("1").transform(val => parseInt(val, 10)),
  limit: z.string().optional().default("10").transform(val => parseInt(val, 10)),
  favorites: z.string().optional().refine(val => ["true", "false", "1", "0"].includes(val))
});
```

### **3. Sistema de Autenticação JWT**
```typescript
// src/middlewares/authentication.middleware.ts
export const validToken = async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.replace("Bearer ", "");
    
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as { user: string };
    const user = await getUserById(decoded.user);
    
    req.user = decoded.user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new CustomError("Token expirado", 401));
    }
    next(error);
  }
};
```

**Geração de Tokens:**
```typescript
// src/service/auth.service.ts
export const signin = async (data: UserAcess): Promise<Tokens> => {
  // Verificação de credenciais
  const isValidPassword = await bcrypt.compare(data.password, user.password);
  
  // Geração de tokens
  const refreshToken = jwt.sign({ user: user._id }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: "3d",
  });
  
  const accessToken = jwt.sign({ user: user._id }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
  
  return { refreshToken, accessToken };
};
```

### **4. Logger para Observabilidade**
```typescript
// src/middlewares/logger.middleware.ts
export const logger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on("finish", async () => {
    const responseTime = Date.now() - startTime;
    const userID = (req as any).user?._id?.toString();
    const feature = getFeature(req.path); // books, auth, users

    await Log.create({
      method: req.method,
      route: req.path,
      statusCode: res.statusCode,
      responseTime,
      userID,
      feature,
      error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined,
    });
  });

  next();
};
```

---

## 📡 **Padrão de Resposta Unificado**

### **Comunicação Frontend-Backend Padronizada**
```typescript
// src/helpers/responsePattern.helper.ts

// ✅ Resposta de Sucesso
const respObj = ({ data = [], message = "" }: ServiceRes) => {
  return { success: true, data, message };
};

// ❌ Resposta de Erro  
const badRespObj = ({ message }: badServiceRes) => {
  return { success: false, message };
};
```

**Exemplo de Uso em Service:**
```typescript
// src/service/book.service.ts
export const getAllBooksByUser = async (userID: string, bookQuery: BookQuery): Promise<ServiceRes> => {
  const result = await repository.getAllBooksByUser(userID, bookQuery);
  return returnData(result);
};

// Resposta padronizada:
{
  "success": true,
  "data": {
    "books": [...],
    "pagination": { "currentPage": 1, "totalPages": 5 }
  },
  "message": "Livros obtidos com sucesso"
}
```

**Por que usar?** Garante consistência, facilita tratamento no frontend e melhora DX.

---

## 📊 **Sistema de Observabilidade**

### **Modelo de Log Unificado**
```typescript
// src/models/log.model.ts
export interface ILog {
  method: string;      // GET, POST, PUT, DELETE
  route: string;       // /books, /auth/signin  
  statusCode: number;  // 200, 404, 500
  responseTime: number; // ms
  ip: string;          // Cliente IP
  userID?: string;     // ID do usuário autenticado
  feature?: string;    // books, auth, users, system
  error?: string;      // Mensagem de erro se status >= 400
  timestamp: Date;     // Quando ocorreu
}
```

### **Métricas em Tempo Real**
```typescript
// src/service/log.service.ts

// 🔴 Taxa de erro 500 nas últimas 24h
export const getError500Rate = async () => {
  const total = await repository.getTotalLogs(last24h);
  const errors500 = await repository.getError500Count(last24h);
  
  return {
    total,
    errors500, 
    rate: total > 0 ? ((errors500 / total) * 100).toFixed(2) : "0.00",
  };
};

// 🔥 Heat map de funcionalidades
export const getHeatMap = async () => {
  return await repository.getHeatMapData(last24h);
  // Retorna: [{ feature: "books", requests: 150, uniqueUsers: 25 }]
};

// 🐌 Rotas mais lentas
export const getSlowestRoutes = async () => {
  return await repository.getSlowestRoutesData(last24h);  
  // Retorna: [{ endpoint: "GET /books", avgTime: 450, requests: 100 }]
};
```

---

## 🚀 **Funcionalidades por Rotas**

### **📚 Livros (`/books`)**
```typescript
// src/routes/book.route.ts
router.get("/", validToken, validQuery(bookQuerySchema), getAllBooks);
router.post("/", validToken, validBody(bookSchema), createBook);
router.get("/:isbn", validToken, validParams(bookParamsSchema), getBookByIsbn);
router.put("/:isbn", validToken, validParams(bookParamsSchema), validBody(bookUpdateSchema), updateBook);
router.delete("/:isbn", validToken, validParams(bookParamsSchema), deleteBook);
router.patch("/:isbn/favorite", validToken, validParams(bookParamsSchema), toggleFavorite);
```

**Funcionalidades:**
- **GET /books** - Lista com paginação, busca e filtro de favoritos
- **POST /books** - Cria novo livro com validação completa
- **GET /books/:isbn** - Detalhes de livro específico
- **PUT /books/:isbn** - Atualização completa do livro
- **DELETE /books/:isbn** - Remoção do livro
- **PATCH /books/:isbn/favorite** - Toggle status de favorito

### **🔐 Autenticação (`/auth`)**
```typescript
// src/routes/auth.route.ts
router.post("/signin", validBody(userAcessSchema), signin);
router.post("/refresh", validRefreshToken, refresh);
router.post("/logout", validToken, logout);
```

**Funcionalidades:**
- **POST /auth/signin** - Login com credenciais
- **POST /auth/refresh** - Renovação de access token via refresh token
- **POST /auth/logout** - Logout e invalidação de tokens

### **👤 Usuários (`/user`)**
```typescript
// src/routes/user.route.ts
router.post("/signup", validBody(userAcessSchema), signup);
router.post("/guest", createGuestAccount);
```

**Funcionalidades:**
- **POST /user/signup** - Cadastro de novo usuário
- **POST /user/guest** - Criação de conta temporária de visitante

### **📊 Observabilidade (`/observability`)**
```typescript
// src/routes/log.route.ts
router.get("/", validToken, getSummary);
router.get("/errors", validToken, getError500Rate);  
router.get("/heatmap", validToken, getHeatMap);
```

**Funcionalidades:**
- **GET /observability** - Dashboard completo com todas as métricas
- **GET /observability/errors** - Taxa de erros 500 detalhada
- **GET /observability/heatmap** - Mapa de calor de uso das funcionalidades

---

## 🧪 **Cobertura de Testes**

### **Estatísticas Finais**
```
📊 Resultados dos Testes:
✅ 202 testes APROVADOS
✅ 16 suítes de teste
✅ 0 falhas
⚡ Tempo: ~15 segundos
🎯 Cobertura: Routes, Controllers, Services, Repositories
```

### **Tipos de Testes**

**1. Testes Unitários**
```typescript
// src/__tests__/unit/services/log.service.test.ts
describe("Log Service", () => {
  it("deve calcular taxa de erro 500 corretamente", async () => {
    mockRepository.getTotalLogs.mockResolvedValue(100);
    mockRepository.getError500Count.mockResolvedValue(5);
    
    const result = await service.getError500Rate();
    
    expect(result.rate).toBe("5.00");
  });
});
```

**2. Testes de Integração**
```typescript
// src/__tests__/user.repository.integration.test.ts
describe("User Repository Integration", () => {
  it("deve criar usuário e validar persistência", async () => {
    const userData = { name: "testuser", password: "hash123" };
    
    const createdUser = await repository.signup(userData);
    const foundUser = await repository.getUserById(createdUser._id);
    
    expect(foundUser?.name).toBe(userData.name);
  });
});
```

**3. Testes de Rotas**
```typescript
// src/__tests__/book.routes.test.ts
describe("GET /books", () => {
  it("deve retornar livros do usuário autenticado", async () => {
    const response = await request(app)
      .get("/books")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.books).toBeDefined();
  });
});
```

---

## 🐳 **Deploy e Ambiente**

### **Ambiente de Desenvolvimento**
```bash
# 🛠️ MongoDB Local + Hot Reload
./start.sh dev

# Serviços disponíveis:
# Frontend: http://localhost:5173
# Backend:  http://localhost:8080
# MongoDB: mongodb://localhost:27017/bookstack
```

### **Ambiente de Produção**  
```bash
# 🚀 MongoDB Atlas + Build Otimizado
./start.sh prod

# Usa MongoDB Atlas:
# mongodb+srv://user:pass@cluster.mongodb.net/bookstack
```

### **Scripts de Gerenciamento**
```bash
./start.sh stop    # Para todos os containers
./start.sh logs    # Mostra logs em tempo real
./start.sh clean   # Remove containers e volumes
```

### **Docker Multistage Otimizado**
```dockerfile
# Dockerfile - Produção otimizada
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:20-alpine AS production
WORKDIR /app  
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

**Benefícios:**
- **Imagem final pequena**: Apenas dependências de produção
- **Build isolado**: Separação entre build e runtime
- **Segurança**: Sem ferramentas de desenvolvimento em produção

---

## 🔧 **Configuração e Variáveis**

### **Variáveis de Ambiente**
```env
# .env.example
MONGODB_URI=mongodb://localhost:27017/bookstack
PORT=8080
ACCESS_TOKEN_SECRET=your_super_secret_access_key_here
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key_here
NODE_ENV=development
```

### **Scripts Package.json**
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",           // Desenvolvimento com hot reload
    "build": "tsc -p tsconfig.build.json",     // Build para produção
    "start": "node dist/server.js",            // Produção
    "test": "jest",                            // Todos os testes
    "test:watch": "jest --watch",              // Testes em watch mode
    "test:coverage": "jest --coverage",        // Cobertura de testes
    "lint": "biome check src/",                // Linting
    "lint:fix": "biome check src/ --apply"     // Fix automático
  }
}
```

---

## 🎯 **Stack Tecnológico Completo**

### **Backend Core**
- **🟢 Node.js 20** - Runtime JavaScript moderno
- **⚡ Express.js 4** - Framework web minimalista
- **🔷 TypeScript 5** - Tipagem estática e produtividade
- **🍃 MongoDB + Mongoose** - Banco NoSQL com ODM

### **Segurança e Validação**
- **🔐 JWT (jsonwebtoken)** - Autenticação stateless
- **🛡️ bcrypt** - Hash seguro de senhas
- **✅ Zod** - Validação de schemas em runtime
- **🔒 CORS** - Controle de acesso cross-origin

### **Qualidade e Testes**
- **🧪 Jest** - Framework de testes robusto
- **🎭 Supertest** - Testes de integração HTTP
- **📊 MongoDB Memory Server** - Testes com banco em memória
- **🔍 Biome** - Linting e formatação ultrarrápida

### **DevOps e Deploy**
- **🐳 Docker** - Containerização e deploy
- **📦 pnpm** - Gerenciador de pacotes eficiente
- **⚡ tsx** - Execução TypeScript em desenvolvimento
- **🔄 Docker Compose** - Orquestração multi-container

---

## 🚀 **Como Executar o Projeto**

### **1. Pré-requisitos**
```bash
# Instalar Docker e Docker Compose
docker --version
docker compose version

# Opcional: Node.js 20+ para desenvolvimento local
node --version
```

### **2. Configuração Inicial**
```bash
# Clone do repositório
git clone <repo-url>
cd BookStack

# Configurar variáveis de ambiente
cd Express-BookStack
cp .env.example .env
# Editar .env com suas configurações

cd ../Vue-BookStack  
cp .env.example .env
# Editar .env com URL do backend
```

### **3. Execução com Docker**
```bash
# Desenvolvimento (MongoDB local)
cd Vue-BookStack
./start.sh dev

# Produção (MongoDB Atlas)  
./start.sh prod

# Parar serviços
./start.sh stop

# Ver logs
./start.sh logs

# Limpeza completa
./start.sh clean
```

### **4. Desenvolvimento Local (Opcional)**
```bash
# Backend
cd Express-BookStack
pnpm install
pnpm dev

# Frontend (terminal separado)
cd Vue-BookStack  
pnpm install
pnpm dev
```

---

Este projeto demonstra **expertise completa** em desenvolvimento backend moderno, desde arquitetura escalável até observabilidade em produção, representando as melhores práticas da indústria. 🚀
