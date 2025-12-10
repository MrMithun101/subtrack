import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { ForecastPoint } from '../utils/chartData';
import Card from './ui/Card';
import LoadingSpinner from './LoadingSpinner';

interface SpendingForecastChartProps {
  data: ForecastPoint[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Formats a number as currency (assumes USD for now)
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Spending forecast chart component showing projected monthly costs over time.
 * 
 * Displays a line chart of normalized monthly spending for the next 12 months
 * based on current active subscriptions.
 */
export default function SpendingForecastChart({
  data,
  isLoading = false,
  error = null,
}: SpendingForecastChartProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Spending Forecast</h3>
          <p className="mt-1 text-sm text-gray-600">
            Based on your current active subscriptions. Yearly and weekly plans are converted to a monthly equivalent.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
          <span className="ml-3 text-sm text-gray-600">Loading forecast...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Spending Forecast</h3>
        </div>
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Spending Forecast</h3>
          <p className="mt-1 text-sm text-gray-600">
            Based on your current active subscriptions. Yearly and weekly plans are converted to a monthly equivalent.
          </p>
        </div>
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            No subscriptions yet. Add a subscription to see your spending forecast.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Spending Forecast</h3>
        <p className="mt-1 text-sm text-gray-600">
          Based on your current active subscriptions. Yearly and weekly plans are converted to a monthly equivalent.
        </p>
      </div>
      <div className="px-6 py-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Line
              type="monotone"
              dataKey="totalMonthlyCost"
              stroke="#111827"
              strokeWidth={2}
              dot={{ fill: '#111827', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

