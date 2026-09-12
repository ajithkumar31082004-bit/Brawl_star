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
  highestTrophies?: number;
  coins: number;
  gems: number;
  avatar: string;
  rank: string;
  wins: number;
  losses: number;
  matches: number;
  role?: string;
}

export interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  login:  (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;

  // Called by the API interceptor when it gets a new token pair
  setTokens: (accessToken: string, refreshToken: string) => void;

  // Legacy stubs — economy is now server-authoritative.
  // These update local display only; server is the source of truth.
  addCoins: (amount: number) => void;
  addGems:  (amount: number) => void;
  buyItem:  (itemId: string, price: number, currency: 'coins' | 'gems') => boolean;
}


export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:          null,
      accessToken:   null,
      refreshToken:  null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      // Local-display-only stubs — server is source of truth for economy
      addCoins: (amount) =>
        set((state) => ({
          user: state.user ? { ...state.user, coins: state.user.coins + amount } : null,
        })),

      addGems: (amount) =>
        set((state) => ({
          user: state.user ? { ...state.user, gems: state.user.gems + amount } : null,
        })),

      buyItem: (_itemId, price, currency) => {
        const state = useAuthStore.getState();
        const user = state.user;
        if (!user) return false;
        if (currency === 'coins') {
          if (user.coins < price) return false;
          state.updateUser({ coins: user.coins - price });
          return true;
        } else {
          if (user.gems < price) return false;
          state.updateUser({ gems: user.gems - price });
          return true;
        }
      },
    }),
    {
      name: 'battleverse-auth-v2',
      partialize: (state) => ({
        user:            state.user,
        accessToken:     state.accessToken,
        refreshToken:    state.refreshToken,
        isAuthenticated: !!state.accessToken,
      }),
    }
  )
);

// ─── Backward-compat export (Auth.tsx still imports this) ────────────────────
// Will be removed once Auth.tsx is fully migrated to real API calls
export const loginWithMock = () => {
  console.warn('[Auth] loginWithMock() called — this is a stub. Connect to real API.');
};

