# @mfe-deep/auth-lib

Biblioteca de autenticação em Node/TypeScript usando clean architecture. Fornece casos de uso de registro, login, validação de token e logout com blacklist em cache.

- O consumidor implementa integrações: banco (MySQL), cache (Redis), hasher de senha e gerenciador de tokens (JWT).
- A biblioteca mantém apenas portas (interfaces) e o serviço de aplicação `AuthService`.

## Guia Rápido

- Implemente suas integrações (lado do app): `UserRepository`, `PasswordHasher`, `TokenManager` (JWT) e opcionalmente `CacheStore` (Redis).
- Defina funções utilitárias de usuário: `buildUser`, `getUserId`, `getPasswordHash`, e opcional `buildClaims`.
- Monte o `AuthService` e use os casos de uso `register`, `login`, `validate`, `logout`.

### Montar o AuthService

```ts
import { AuthService, RegisterInput } from '@cleyton-s-santos/auth-lib'

type User = { id: string; email: string; passwordHash: string }

const buildUser = (data: RegisterInput, hashed: string): User => ({
  id: crypto.randomUUID(),
  email: data.email,
  passwordHash: hashed,
})

const auth = new AuthService<User>({
  userRepo: /* sua implementação */,
  hasher: /* bcrypt/argon */,
  token: /* JWT */,
  cache: /* Redis opcional */, 
  buildUser,
  getUserId: (u) => u.id,
  getPasswordHash: (u) => u.passwordHash,
  buildClaims: (u) => ({ email: u.email }),
})
```

### Usar funcionalidades

```ts
// Registro
await auth.register({ email: 'a@a.com', password: 'secret', attributes: { name: 'Gaby' } })

// Login
const { user, token } = await auth.login({ email: 'a@a.com', password: 'secret' })

// Validação
const v = await auth.validate(token) // { valid, claims, user }

// Logout (blacklist)
await auth.logout(token)
```

### Integração por framework

- Express: chame `register/login/validate/logout` nos handlers das rotas e leia o token do header `Authorization: Bearer <token>`.
- NestJS: injete o `AuthService` em um `Controller` e mapeie os endpoints para os métodos do serviço.
- Next.js (App Router): use o `AuthService` nos `route handlers` e responda com `Response.json(...)`; defina `runtime = 'nodejs'` quando necessário.

## Instalação

```bash
npm install @cleyton-s-santos/auth-lib
```

Requisitos sugeridos para integrações:

```bash
npm install mysql2 redis jsonwebtoken bcryptjs
```

Node 18+ recomendado.

## Conceitos

- Portas:
  - `UserRepository<TUser>` para persistência do usuário
  - `PasswordHasher` para hash/compare de senhas
  - `TokenManager` para emissão e verificação de tokens
  - `CacheStore` opcional para blacklist de logout
- Serviço:
  - `AuthService<TUser>` com métodos `register`, `login`, `validate`, `logout`
- Tipos:
  - `RegisterInput`, `LoginInput`, `ValidationResult`

### Contratos principais

```ts
// UserRepository
findByEmail(email: string): Promise<TUser | null>
findById(id: string): Promise<TUser | null>
create(user: TUser): Promise<TUser>
update(user: TUser): Promise<TUser>

// PasswordHasher
hash(plain: string): Promise<string>
compare(plain: string, hashed: string): Promise<boolean>

// TokenManager
issue(claims: { sub: string } & Record<string, unknown>, options?: { expiresInSeconds?: number }): Promise<string>
verify(token: string): Promise<{ claims: any; jti?: string; exp?: number }>

// CacheStore
get(key: string): Promise<string | null>
set(key: string, value: string, ttlSeconds?: number): Promise<void>
del(key: string): Promise<void>
```

### Montagem padrão

```ts
import { AuthService, RegisterInput } from '@cleyton-s-santos/auth-lib'

type User = { id: string; email: string; passwordHash: string; name?: string }

const buildUser = (data: RegisterInput, hashed: string): User => ({
  id: crypto.randomUUID(),
  email: data.email,
  passwordHash: hashed,
  name: typeof data.attributes?.name === 'string' ? data.attributes!.name : undefined,
})

const getUserId = (u: User) => u.id
const getPasswordHash = (u: User) => u.passwordHash
const buildClaims = (u: User) => ({ email: u.email })

const auth = new AuthService<User>({
  userRepo: new MySqlUserRepo(),
  hasher: new BcryptHasher(),
  token: new JwtManager(),
  cache: new RedisCache(),
  buildUser,
  getUserId,
  getPasswordHash,
  buildClaims,
})
```

## NestJS — Configuração

### Passos

- Implemente suas portas (`UserRepository`, `PasswordHasher`, `TokenManager`, `CacheStore opcional`).
- Defina utilitários do usuário (`buildUser`, `getUserId`, `getPasswordHash`, `buildClaims opcional`).
- Provisione o `AuthService` no módulo via `useFactory` e injete no seu `Controller`.

### Módulo

```ts
// auth.module.ts
import { Module } from '@nestjs/common'
import { AuthService as CoreAuthService, RegisterInput } from '@cleyton-s-santos/auth-lib'
import { AuthController } from './auth.controller'

type User = { id: string; email: string; passwordHash: string }

const buildUser = (data: RegisterInput, hashed: string): User => ({ id: crypto.randomUUID(), email: data.email, passwordHash: hashed })

@Module({
  controllers: [AuthController],
  providers: [MySqlUserRepo, RedisCache, BcryptHasher, JwtManager, {
    provide: CoreAuthService,
    useFactory: (repo: MySqlUserRepo, cache: RedisCache, hasher: BcryptHasher, jwtm: JwtManager) => new CoreAuthService<User>({
      userRepo: repo,
      cache,
      hasher,
      token: jwtm,
      buildUser,
      getUserId: (u) => u.id,
      getPasswordHash: (u) => u.passwordHash,
      buildClaims: (u) => ({ email: u.email }),
    }),
    inject: [MySqlUserRepo, RedisCache, BcryptHasher, JwtManager],
  }],
  exports: [CoreAuthService],
})
export class AuthModule {}
```

### Controller

```ts
// auth.controller.ts
import { Controller, Post, Body, Get, Req } from '@nestjs/common'
import { AuthService as CoreAuthService } from '@cleyton-s-santos/auth-lib'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: CoreAuthService<any>) {}

  @Post('register')
  async register(@Body() body: any) {
    const user = await this.auth.register({ email: body.email, password: body.password, attributes: { name: body.name } })
    return { id: user.id }
  }

  @Post('login')
  async login(@Body() body: any) {
    const { user, token } = await this.auth.login({ email: body.email, password: body.password })
    return { token, user: { id: user.id, email: user.email } }
  }

  @Get('me')
  async me(@Req() req: any) {
    const token = String(req.headers.authorization?.replace('Bearer ', '') ?? '')
    const v = await this.auth.validate(token)
    if (!v.valid) return { error: 'TOKEN_INVALID' }
    return { claims: v.claims, user: v.user ? { id: v.user.id, email: v.user.email } : null }
  }

  @Post('logout')
  async logout(@Req() req: any) {
    const token = String(req.headers.authorization?.replace('Bearer ', '') ?? '')
    await this.auth.logout(token)
    return {}
  }
}
```

### Ambiente

- Banco: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
- Redis: `REDIS_URL`
- JWT: `JWT_SECRET`

### Comandos

```bash
npm run build
npm run test
npm run typecheck
```
