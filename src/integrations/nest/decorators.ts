import { SetMetadata } from "@nestjs/common";
import { PERMISSIONS_KEY, ROLES_KEY } from "./constants.js";

export const Auth = () => SetMetadata("authlib:protected", true);

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
