import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
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

export interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  addCoins: (amount: number) => void;
  addGems: (amount: number) => void;
  buyItem: (itemId: string, price: number, currency: 'coins' | 'gems') => boolean;
}

export const MOCK_USER: User = {
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
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      addCoins: (amount) =>
        set((state) => ({
          user: state.user ? { ...state.user, coins: state.user.coins + amount } : null,
        })),

      addGems: (amount) =>
        set((state) => ({
          user: state.user ? { ...state.user, gems: state.user.gems + amount } : null,
        })),

      buyItem: (_itemId, price, currency) => {
        const user = get().user;
        if (!user) return false;
        if (currency === 'coins') {
          if (user.coins < price) return false;
          set({ user: { ...user, coins: user.coins - price } });
          return true;
        } else {
          if (user.gems < price) return false;
          set({ user: { ...user, gems: user.gems - price } });
          return true;
        }
      },
    }),
    {
      name: 'battleverse-auth',
    }
  )
);

export const loginWithMock = () => {
  useAuthStore.getState().login(MOCK_USER, 'mock-jwt-token');
};
