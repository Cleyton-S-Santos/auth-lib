import bcrypt from "bcrypt";
import type { CryptoProviderPort } from "../../core/ports/crypto-provider.port.js";

export class BcryptCryptoAdapter implements CryptoProviderPort {
  constructor(private readonly saltRounds = 12) {}

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
