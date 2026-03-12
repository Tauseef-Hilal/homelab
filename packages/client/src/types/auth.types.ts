import { responseSchemas } from '@homelab/shared/schemas/auth';

export type User = responseSchemas.MeResponse['user'];

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  authInitialized: boolean;
  setAccessToken: (token: string) => void;
  setAuthInitialized: (authInitialized: boolean) => void;
  setUser: (user: User) => void;
  logout: () => void;
}
