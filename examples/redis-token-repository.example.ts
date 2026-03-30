// import type { Redis } from "ioredis";
// import type {
//   StoreRefreshTokenInput,
//   TokenRepositoryPort,
// } from "auth-lib";

// export function createRedisTokenRepository(redis: Redis): TokenRepositoryPort {
//   const rtKey = (id: string) => `auth:rt:${id}`;
//   const blKey = (jti: string) => `auth:bl:access:${jti}`;

//   return {
//     async storeRefreshToken(input: StoreRefreshTokenInput): Promise<void> {
//       const ttlSec = Math.max(
//         1,
//         Math.floor((input.expiresAt.getTime() - Date.now()) / 1000),
//       );
//       await redis.set(
//         rtKey(input.tokenId),
//         input.refreshToken,
//         "EX",
//         ttlSec,
//       );
//     },

//     async revokeRefreshToken(tokenId: string): Promise<void> {
//       await redis.del(rtKey(tokenId));
//     },

//     async isRefreshTokenRevoked(tokenId: string): Promise<boolean> {
//       const v = await redis.get(rtKey(tokenId));
//       return v === null;
//     },

//     async blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void> {
//       await redis.set(blKey(jti), "1", "EX", Math.max(1, ttlSeconds));
//     },

//     async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
//       const v = await redis.get(blKey(jti));
//       return v !== null;
//     },
//   };
// }
