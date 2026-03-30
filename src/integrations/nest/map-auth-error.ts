import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthError } from "../../core/errors/auth-error.js";
import { ForbiddenError } from "../../core/errors/forbidden.error.js";
import { InvalidCredentialsError } from "../../core/errors/invalid-credentials.error.js";
import { MisconfigurationError } from "../../core/errors/misconfiguration.error.js";
import { TokenExpiredError } from "../../core/errors/token-expired.error.js";
import { UnauthorizedError } from "../../core/errors/unauthorized.error.js";
import { ValidationError } from "../../core/errors/validation.error.js";

export function throwHttpFromAuthError(err: unknown): never {
  if (err instanceof ValidationError) {
    throw new BadRequestException(err.message);
  }
  if (err instanceof InvalidCredentialsError) {
    throw new UnauthorizedException(err.message);
  }
  if (err instanceof UnauthorizedError) {
    throw new UnauthorizedException(err.message);
  }
  if (err instanceof TokenExpiredError) {
    throw new UnauthorizedException(err.message);
  }
  if (err instanceof ForbiddenError) {
    throw new ForbiddenException(err.message);
  }
  if (err instanceof MisconfigurationError) {
    throw new InternalServerErrorException(err.message);
  }
  if (err instanceof AuthError) {
    throw new InternalServerErrorException(err.message);
  }
  throw new InternalServerErrorException(
    err instanceof Error ? err.message : "Erro interno",
  );
}
