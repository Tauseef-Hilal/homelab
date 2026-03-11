import { responseSchemas } from '@homelab/shared/schemas/auth';

export type User = responseSchemas.MeResponse['user'];

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}
