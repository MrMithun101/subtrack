import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { subscriptions } from '../api/endpoints';
import type { Subscription, SubscriptionSummary, SubscriptionCreate } from '../api/types';
import { buildSpendingForecast, buildCategoryBreakdown } from '../utils/chartData';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import SubscriptionForm from '../components/SubscriptionForm';
import SpendingForecastChart from '../components/SpendingForecastChart';
import CategoryBreakdownChart from '../components/CategoryBreakdownChart';

export default function Dashboard() {
  const { user } = useAuth();
  const [subscriptionList, setSubscriptionList] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [upcomingRenewals, setUpcomingRenewals] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      console.log('[Dashboard] Starting load, token:', token ? 'exists' : 'missing');
      
      const [subscriptionsData, summaryData] = await Promise.all([
        subscriptions.list(),
        subscriptions.getSummary(),
      ]);
      
      console.log('[Dashboard] Data loaded successfully');
      setSubscriptionList(subscriptionsData);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('[Dashboard] Load error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load subscriptions';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUpcomingRenewals = async () => {
    setIsLoadingUpcoming(true);
    try {
      const upcoming = await subscriptions.getUpcoming(7);
      setUpcomingRenewals(upcoming);
    } catch (err: any) {
      console.error('[Dashboard] Failed to load upcoming renewals:', err);
      // Don't set error state - just log it, don't break the dashboard
    } finally {
      setIsLoadingUpcoming(false);
    }
  };

  useEffect(() => {
    loadData();
    loadUpcomingRenewals();
  }, []);

  // Reload upcoming renewals when subscriptions change
  useEffect(() => {
    if (!isLoading) {
      loadUpcomingRenewals();
    }
  }, [subscriptionList, isLoading]);

  const handleAddSubscription = async (data: SubscriptionCreate) => {
    try {
      await subscriptions.create(data);
      setShowAddForm(false);
      // Reload data to show the new subscription
      await loadData();
      await loadUpcomingRenewals();
    } catch (err: any) {
      console.error('Failed to create subscription:', err);
      throw err; // Let the form handle the error
    }
  };

  const handleDeleteSubscription = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subscription?')) {
      return;
    }

    setDeletingId(id);
    try {
      await subscriptions.delete(id);
      // Reload data to reflect the deletion
      await loadData();
      await loadUpcomingRenewals();
    } catch (err: any) {
      console.error('Failed to delete subscription:', err);
      alert(err.response?.data?.detail || 'Failed to delete subscription');
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (amount: number, currency: string | null | undefined = 'USD') => {
    // Validate currency code - default to USD if invalid
    const validCurrency = currency && typeof currency === 'string' && currency.length === 3 
      ? currency.toUpperCase() 
      : 'USD';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: validCurrency,
      }).format(amount);
    } catch (error) {
      // Fallback if currency code is still invalid
      console.warn('Invalid currency code:', currency, 'using USD instead');
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntil = (dateString: string | null): number | null => {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Compute chart data using useMemo
  const forecastData = useMemo(
    () => buildSpendingForecast(subscriptionList),
    [subscriptionList]
  );

  const categoryData = useMemo(
    () => buildCategoryBreakdown(subscriptionList),
    [subscriptionList]
  );

  console.log('[Dashboard] Rendering with state:', { isLoading, error, hasUser: !!user });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              {user ? `Welcome back, ${user.full_name || user.email}` : 'Track and manage your subscriptions'}
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            + Add Subscription
          </Button>
        </div>

        {showAddForm && (
          <SubscriptionForm
            onSubmit={handleAddSubscription}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {isLoading && (
          <Card>
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-3 text-sm text-gray-600">Loading subscriptions...</span>
            </div>
          </Card>
        )}

        {!isLoading && error && (
          <Card>
            <div className="space-y-4 p-4">
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                <strong>Error:</strong> {error}
              </div>
              <div className="text-sm text-gray-600">
                <p>This usually means your authentication token is invalid or expired.</p>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/login';
                  }}
                  className="mt-3 px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800"
                >
                  Log Out and Sign In Again
                </button>
              </div>
            </div>
          </Card>
        )}

        {!isLoading && !error && (
          <>
            {/* Alert Banner for Upcoming Renewals */}
            {upcomingRenewals.length > 0 && (
              <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
                <strong>Reminder:</strong> You have {upcomingRenewals.length} subscription{upcomingRenewals.length > 1 ? 's' : ''} renewing soon.
                {' '}Check the "Upcoming renewals" section below.
              </div>
            )}

            {summary && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <div className="text-sm font-medium text-gray-600">Active Subscriptions</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">
                    {summary.total_active}
                  </div>
                </Card>
                <Card>
                  <div className="text-sm font-medium text-gray-600">Monthly Cost</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">
                    {formatCurrency(summary.total_monthly_cost)}
                  </div>
                </Card>
                <Card>
                  <div className="text-sm font-medium text-gray-600">By Cycle</div>
                  <div className="mt-1 space-y-1 text-sm text-gray-700">
                    <div>Monthly: {formatCurrency(summary.by_billing_cycle.monthly)}</div>
                    <div>Yearly: {formatCurrency(summary.by_billing_cycle.yearly)}</div>
                    <div>Weekly: {formatCurrency(summary.by_billing_cycle.weekly)}</div>
                  </div>
                </Card>
              </div>
            )}

            {/* Upcoming Renewals Card */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Renewals</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Subscriptions renewing in the next 7 days.
                </p>
              </div>
              <div className="px-6 py-4">
                {isLoadingUpcoming ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner />
                    <span className="ml-2 text-sm text-gray-600">Loading upcoming renewals...</span>
                  </div>
                ) : upcomingRenewals.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    No renewals in the next 7 days. You're all clear ✨
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingRenewals.map((sub) => {
                      const daysLeft = getDaysUntil(sub.next_billing_date);
                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-sm font-semibold text-gray-900">{sub.name}</h3>
                              {daysLeft !== null && daysLeft >= 0 && (
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                    daysLeft <= 1
                                      ? 'bg-red-100 text-red-800'
                                      : daysLeft <= 3
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {daysLeft === 0
                                    ? 'Today'
                                    : daysLeft === 1
                                    ? '1 day left'
                                    : `${daysLeft} days left`}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                              <span>{formatCurrency(sub.price, sub.currency)}</span>
                              <span className="capitalize">{sub.billing_cycle}</span>
                              <span>{formatDate(sub.next_billing_date)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Charts Section */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <SpendingForecastChart
                  data={forecastData}
                  isLoading={isLoading}
                  error={error}
                />
              </div>
              <div className="lg:col-span-1">
                <CategoryBreakdownChart
                  data={categoryData}
                  isLoading={isLoading}
                  error={error}
                />
              </div>
            </div>

            <Card className="overflow-hidden p-0">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Your Subscriptions</h2>
              </div>
              {subscriptionList.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No subscriptions yet. Add your first subscription to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cycle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Billing</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subscriptionList.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{sub.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(sub.price, sub.currency)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 capitalize">{sub.billing_cycle}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatDate(sub.next_billing_date)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{sub.category || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              sub.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {sub.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteSubscription(sub.id)}
                              disabled={deletingId === sub.id}
                              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === sub.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
