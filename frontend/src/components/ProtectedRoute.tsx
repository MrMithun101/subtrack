import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component that requires authentication
 * Redirects to /login if user is not authenticated
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, token } = useAuth();

  console.log('[ProtectedRoute] Auth state:', { isAuthenticated, isLoading, hasUser: !!user, hasToken: !!token });

  // Show loading spinner while checking auth (but with timeout)
  if (isLoading) {
    // Add timeout to prevent infinite loading
    setTimeout(() => {
      console.warn('[ProtectedRoute] Loading timeout - forcing render');
    }, 5000);
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  console.log('[ProtectedRoute] Rendering protected content');
  return <>{children}</>;
}
