export interface AuthUser {
  id: string | number;
  email?: string;
  password?: string;
  roles?: string[];
  permissions?: string[];
}
