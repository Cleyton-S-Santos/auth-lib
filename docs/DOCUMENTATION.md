# auth-lib — documentação

Biblioteca TypeScript de autenticação desacoplada (hexagonal), com JWT, refresh, blacklist de access, RBAC e ports plugáveis. Não inclui drivers de banco ou Redis; o consumidor implementa os ports.

## Sumário

1. [Instalação e dependências](#instalação-e-dependências)
2. [Arquitetura](#arquitetura)
3. [Contrato `AuthUser`](#contrato-authuser)
4. [Configuração (`AuthConfig`)](#configuração-authconfig)
5. [Ports](#ports)
6. [Claims dos JWT](#claims-dos-jwt)
7. [Casos de uso e `AuthService`](#casos-de-uso-e-authservice)
8. [Validação na inicialização](#validação-na-inicialização)
9. [Erros](#erros)
10. [Adapters inclusos (`jose`, `bcrypt`)](#adapters-inclusos-jose-bcrypt)
11. [Integração Express](#integração-express)
12. [Integração NestJS](#integração-nestjs)
13. [Fluxos (login, refresh, logout)](#fluxos-login-refresh-logout)
14. [Segurança](#segurança)
15. [Testes e build](#testes-e-build)
16. [Exemplos no repositório](#exemplos-no-repositório)

---

## Instalação e dependências

```bash
npm install auth-lib
```

Substitua o nome do pacote se publicar com escopo (`@org/auth-lib`).

Dependências diretas da lib (adapters padrão):

- **jose** — JWT (o `JoseJwtAdapter` usa HS256 com segredo compartilhado).
- **bcrypt** — `BcryptCryptoAdapter` para `hash` / `compare`.

Peer opcionais:

- **express** — middlewares em `auth-lib/express`.
- **@nestjs/common**, **@nestjs/core**, **reflect-metadata** — `auth-lib/nest`.

---

## Arquitetura

- **Core**: entidades/contratos (`AuthUser`), casos de uso, erros, ports (interfaces). Sem dependência de frameworks ou drivers.
- **Adapters**: implementações opcionais (`JoseJwtAdapter`, `BcryptCryptoAdapter`).
- **Integrações**: Express (middlewares) e NestJS (guards, decorators).

Persistência (SQL, Redis, etc.) fica **fora** do core, atrás dos ports.

---

## Contrato `AuthUser`

Campos mínimos usados pela lib:

- `id` (obrigatório nos fluxos que validam o usuário)
- `email` (opcional)
- `password` — esperado como **hash** para `compare` no login
- `roles`, `permissions` — arrays de strings para RBAC nos JWT

O consumidor implementa `UserRepositoryPort.toAuthUser` para mapear a entidade do banco para `AuthUser`.

---

## Configuração (`AuthConfig`)

| Campo | Descrição |
|--------|-----------|
| `jwtSecret` | Segredo para assinatura HS256 (adapters padrão) |
| `accessTokenExpiresIn` | Duração do access (ex.: `15m`, `1h`, `7d`) |
| `refreshTokenExpiresIn` | Duração do refresh |
| `refreshTokenRotation` | Opcional: a cada refresh, revoga o refresh anterior e emite novo par |
| `issuer`, `audience` | Opcionais; repassados ao `JoseJwtAdapter` se definidos |

Na criação de `AuthService` / `createAuthService`, a lib valida segredo não vazio, formato de durações e métodos dos ports. Falhas geram `MisconfigurationError` e mensagens prefixadas `[AuthLib Error]` no stderr (via `logAuthLibError` interno).

---

## Ports

| Port | Função |
|------|--------|
| `UserRepositoryPort` | `findByIdentifier(identifier, kind?)` com `kind` `'email'` ou `'id'`; `toAuthUser` |
| `TokenRepositoryPort` | Persistência de refresh, revogação, blacklist por `jti` do access, consulta de blacklist; opcionalmente `isRefreshTokenRevoked` |
| `JwtProviderPort` | Assinar access/refresh, `verify`, `decode` |
| `CryptoProviderPort` | `hash`, `compare` |
| `CacheProviderPort` | Opcional: abstração genérica para compor repositórios no seu app |

---

## Claims dos JWT

- **Access**: `sub`, `jti`, `typ: "access"`, `roles`, `permissions` (arrays).
- **Refresh**: `sub`, `rtid`, `typ: "refresh"`.

**Logout**: o access é verificado com assinatura válida; se estiver expirado, o `JoseJwtAdapter` valida assinatura via `compactVerify` quando `verify` recebe `ignoreExpiration: true`, para permitir extrair `jti` e colocar na blacklist sem aceitar token forjado.

---

## Casos de uso e `AuthService`

Funções exportadas: `login`, `refreshToken`, `logout`, `validateAccessToken`, `checkRole`, `checkPermission`.

`AuthService` agrupa essas operações e recebe todos os ports + `AuthConfig` via `createAuthService`.

---

## Validação na inicialização

`validateAuthPorts` (e o construtor de `AuthService`) verificam se os métodos obrigatórios dos ports existem e se a configuração é coerente.

---

## Erros

| Classe | Situação típica |
|--------|------------------|
| `AuthError` | Base |
| `ValidationError` | Entrada inválida |
| `InvalidCredentialsError` | Login |
| `TokenExpiredError` | Access expirado na verificação normal |
| `UnauthorizedError` | Token inválido, revogado, ausente |
| `ForbiddenError` | RBAC |
| `MisconfigurationError` | Config, ports ou `AuthUser` sem `id` |

Em NestJS, os guards podem mapear para `HttpException` via `throwHttpFromAuthError`.

---

## Adapters inclusos (jose, bcrypt)

**JoseJwtAdapter** (`import { JoseJwtAdapter } from "auth-lib"`):

- `signAccessToken` / `signRefreshToken` com `SignJWT`, HS256.
- `verify`: usa `jwtVerify`; se `JWTExpired` e `ignoreExpiration`, usa `compactVerify` para validar só a assinatura.
- `decodeJwt` para `decode` sem verificação.

**BcryptCryptoAdapter**: custo configurável (padrão 12).

Entradas adicionais do pacote:

- `auth-lib/adapters/jwt-jose`
- `auth-lib/adapters/crypto-bcrypt`

---

## Integração Express

Pacote: `auth-lib/express`.

- `createAuthMiddleware(auth)` — valida Bearer e preenche `req.auth`.
- `createRoleMiddleware`, `createPermissionMiddleware`.
- `createAuthErrorHandler`.
- Importar o módulo carrega o augment de `Request` (`auth`).

---

## Integração NestJS

Pacote: `auth-lib/nest`.

- `AUTH_SERVICE`, `AuthGuard`, `RolesGuard`, `PermissionsGuard`.
- `@Roles()`, `@Permissions()`, `@Auth()`.
- Ordem recomendada: `AuthGuard` antes de guards de RBAC.

---

## Fluxos (login, refresh, logout)

1. **Login**: credenciais → `UserRepository` + `compare` → emissão de tokens + `storeRefreshToken`.
2. **Refresh**: verifica refresh → opcionalmente `isRefreshTokenRevoked` → novo access (e rotação se configurado).
3. **Logout**: blacklist do `jti` do access; opcionalmente revoga refresh informado.

---

## Segurança

- Senhas apenas como hash no contrato usado para `compare`.
- HTTPS em produção.
- Rotação de refresh opcional; `isRefreshTokenRevoked` recomendado quando há armazenamento de sessões.

---

## Testes e build

```bash
npm test
npm run build
```

Build: **tsup** → ESM, CJS e tipos em `dist/`.

---

## Exemplos no repositório

- `examples/redis-token-repository.example.ts` — esboço de `TokenRepositoryPort` com ioredis.
- `example-impl/` — exemplos de consumo (Express, Nest), quando presentes no repo.

---

## Licença

MIT
