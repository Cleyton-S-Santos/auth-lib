# auth-lib

Biblioteca TypeScript de autenticação **desacoplada** (arquitetura hexagonal), com **JWT**, **refresh**,
**blacklist** de access (via port), **RBAC** e integrações **Express** e **NestJS**.  
Não implementa banco de dados nem Redis: você implementa os **ports** no seu projeto.

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [**docs/DOCUMENTATION.md**](docs/DOCUMENTATION.md) | Manual completo: arquitetura, ports, config, adapters, Express, NestJS, erros, fluxos, segurança |

## Instalação rápida

```bash
npm install auth-lib
```

Dependências usadas pelos adapters padrão: **jose** (JWT), **bcrypt** (hash de senha).  
Peers opcionais: **express**; **@nestjs/common**, **@nestjs/core**, **reflect-metadata**.

## Uso mínimo

```ts
import {
  createAuthService,
  JoseJwtAdapter,
  BcryptCryptoAdapter,
} from "auth-lib";
import type { AuthConfig } from "auth-lib";

const config: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET!,
  accessTokenExpiresIn: "15m",
  refreshTokenExpiresIn: "7d",
};

const auth = createAuthService({
  config,
  userRepository: myUserRepository,
  tokenRepository: myTokenRepository,
  jwtProvider: new JoseJwtAdapter({ secret: config.jwtSecret }),
  cryptoProvider: new BcryptCryptoAdapter(12),
});
```

Detalhes dos ports, claims dos tokens, guards e middlewares estão em [**docs/DOCUMENTATION.md**](docs/DOCUMENTATION.md).

## Pacotes de entrada (exports)

| Import | Uso |
|--------|-----|
| `auth-lib` | Core, `AuthService`, adapters, utilitários |
| `auth-lib/express` | Middlewares e handler de erro |
| `auth-lib/nest` | Guards e decorators |
| `auth-lib/adapters/jwt-jose` | Só `JoseJwtAdapter` |
| `auth-lib/adapters/crypto-bcrypt` | Só `BcryptCryptoAdapter` |

## Scripts

```bash
npm run build
npm test
```

## Licença

MIT
