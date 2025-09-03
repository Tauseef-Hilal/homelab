import { create } from 'zustand';
import { AuthState, User } from '../types/auth.types';

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setUser: (user: User) => set({ user }),
  setAccessToken: (accessToken: string) => set({ accessToken }),
  logout: () => set({ user: null, accessToken: null }),
}));

export default useAuthStore;
