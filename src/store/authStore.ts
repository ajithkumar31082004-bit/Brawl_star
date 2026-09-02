import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  maxXp: number;
  trophies: number;
  coins: number;
  gems: number;
  avatar: string;
  rank: string;
  wins: number;
  losses: number;
  matches: number;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const MOCK_USER: User = {
  id: '1',
  username: 'AjithKumar',
  email: 'ajith@example.com',
  level: 28,
  xp: 1620,
  maxXp: 3100,
  trophies: 12540,
  coins: 15420,
  gems: 1250,
  avatar: '🔥',
  rank: 'Diamond I',
  wins: 342,
  losses: 239,
  matches: 581,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'battleverse-auth',
    }
  )
);

// Helper to login with mock data for demo
export const loginWithMock = () => {
  const store = useAuthStore.getState();
  store.login(MOCK_USER, 'mock-jwt-token-12345');
};

export const MOCK_USER_DATA = MOCK_USER;
