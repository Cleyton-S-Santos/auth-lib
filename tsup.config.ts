import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    express: "src/integrations/express/index.ts",
    nest: "src/integrations/nest/index.ts",
    "adapters/jwt-jose": "src/adapters/jwt/jose-jwt.adapter.ts",
    "adapters/crypto-bcrypt": "src/adapters/crypto/bcrypt-crypto.adapter.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "node18",
});
