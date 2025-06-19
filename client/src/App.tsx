import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/pages/AuthPage';
import CalendarPage from '@/pages/CalendarPage';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morandi-sage mx-auto mb-4"></div>
          <p className="text-text-secondary">載入中...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morandi-sage mx-auto mb-4"></div>
          <p className="text-text-secondary">載入中...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/calendar" replace /> : <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route 
          path="/auth" 
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/calendar" 
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/calendar" replace />} />
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#F9F7F5',
                color: '#5A5A5A',
                border: '1px solid #E5E2E0',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              },
              success: {
                iconTheme: {
                  primary: '#9CAF9F',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#D4A5A5',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;