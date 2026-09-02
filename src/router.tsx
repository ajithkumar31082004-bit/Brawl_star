import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { MainLayout, AuthLayout, GameLayout } from './components/layout/MainLayout';
import { useAuthStore } from './store/authStore';

// Lazy load pages
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Heroes = lazy(() => import('./pages/Heroes').then(m => ({ default: m.Heroes })));
const HeroDetail = lazy(() => import('./pages/HeroDetail').then(m => ({ default: m.HeroDetail })));
const Modes = lazy(() => import('./pages/Modes').then(m => ({ default: m.Modes })));
const Lobby = lazy(() => import('./pages/Lobby').then(m => ({ default: m.Lobby })));
const Game = lazy(() => import('./pages/Game').then(m => ({ default: m.Game })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Shop = lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));
const Ranking = lazy(() => import('./pages/Ranking').then(m => ({ default: m.Ranking })));
const Friends = lazy(() => import('./pages/Friends').then(m => ({ default: m.Friends })));
const Events = lazy(() => import('./pages/Events').then(m => ({ default: m.Events })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Login = lazy(() => import('./pages/Auth').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Auth').then(m => ({ default: m.Register })));

// Loading spinner
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <div className="font-heading font-bold text-purple-400 text-sm tracking-widest">LOADING...</div>
      </div>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

function withProtectedSuspense(Component: React.ComponentType) {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: withSuspense(Home) },
      { path: 'heroes', element: withSuspense(Heroes) },
      { path: 'heroes/:id', element: withSuspense(HeroDetail) },
      { path: 'modes', element: withSuspense(Modes) },
      { path: 'ranking', element: withSuspense(Ranking) },
      { path: 'events', element: withSuspense(Events) },
      { path: 'play', element: withProtectedSuspense(Lobby) },
      { path: 'shop', element: withProtectedSuspense(Shop) },
      { path: 'profile', element: withProtectedSuspense(Profile) },
      { path: 'friends', element: withProtectedSuspense(Friends) },
      { path: 'settings', element: withProtectedSuspense(Settings) },
    ],
  },
  {
    path: '/',
    element: <GameLayout />,
    children: [
      { path: 'game', element: withProtectedSuspense(Game) },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: withSuspense(Login) },
      { path: 'register', element: withSuspense(Register) },
    ],
  },
]);
