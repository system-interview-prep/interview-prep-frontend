import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  userId: string;
  name: string;
  email: string;
}

interface UserState {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;

  setUser: (user: User, token: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    set => ({
      currentUser: null,
      token: null,
      isAuthenticated: false,

      setUser: (user, token) =>
        set({ currentUser: user, token, isAuthenticated: true }),

      logout: () =>
        set({ currentUser: null, token: null, isAuthenticated: false }),
    }),
    { name: 'user-store' },
  ),
);
