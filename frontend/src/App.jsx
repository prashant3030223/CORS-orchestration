import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

// Lazy load components
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ApiManagement = lazy(() => import('./pages/ApiManagement'));
const CorsConfig = lazy(() => import('./pages/CorsConfig'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Logs = lazy(() => import('./pages/Logs'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Main Application Routes */}
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="api-management" element={<ApiManagement />} />
              <Route path="cors-rules" element={<CorsConfig />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="logs" element={<Logs />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
