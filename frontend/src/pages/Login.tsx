import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function Login() {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(email, password);
      // Navigation will happen automatically via PublicRoute when isAuthenticated becomes true
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your SubTrack account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-gray-900 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </Card>
      </div>
    </Layout>
  );
}
