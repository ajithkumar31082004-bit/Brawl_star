/**
 * Axios API client with:
 * - JWT access token injection
 * - Automatic token refresh on 401
 * - Request queue during token refresh (no duplicate refresh calls)
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Response interceptor: auto-refresh on 401 ───────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  refreshQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Check if it's a token-expired error specifically
    const data = error.response.data as Record<string, string>;
    if (data?.code !== 'TOKEN_EXPIRED') {
      // Different 401 (wrong credentials, banned, etc.) — logout
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) throw new Error('No refresh token');

      const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const { accessToken: newAccess, refreshToken: newRefresh } = response.data;

      useAuthStore.getState().setTokens(newAccess, newRefresh);
      processQueue(null, newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  me: () =>
    api.get('/auth/me'),
};

// ─── Heroes API ───────────────────────────────────────────────────────────────
export const heroesAPI = {
  all:     () => api.get('/heroes'),
  get:     (slug: string) => api.get(`/heroes/${slug}`),
};

// ─── Profile API ──────────────────────────────────────────────────────────────
export const profileAPI = {
  get:    (userId: string) => api.get(`/profile/${userId}`),
  update: (data: { avatar?: string }) => api.put('/profile', data),
};

// ─── Leaderboard API ──────────────────────────────────────────────────────────
export const leaderboardAPI = {
  global:  (page = 1, limit = 50) => api.get(`/leaderboard?page=${page}&limit=${limit}`),
  friends: () => api.get('/leaderboard/friends'),
  me:      () => api.get('/leaderboard/me'),
};

// ─── Matches API ──────────────────────────────────────────────────────────────
export const matchesAPI = {
  history: (userId: string, page = 1) => api.get(`/matches/history/${userId}?page=${page}`),
};
