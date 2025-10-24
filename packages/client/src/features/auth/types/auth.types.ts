import { MeResponse } from '@shared/schemas/auth/response/auth.schema';

export type User = MeResponse['user'];

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}
