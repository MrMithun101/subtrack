import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { CategoryBreakdownItem } from '../utils/chartData';
import Card from './ui/Card';
import LoadingSpinner from './LoadingSpinner';

interface CategoryBreakdownChartProps {
  data: CategoryBreakdownItem[];
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
 * Pastel color palette for the donut chart
 */
const COLORS = [
  '#a78bfa', // purple-400
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#fb7185', // rose-400
  '#818cf8', // indigo-400
  '#f472b6', // pink-400
  '#4ade80', // green-400
  '#f59e0b', // amber-500
  '#06b6d4', // cyan-500
];

/**
 * Category breakdown chart component showing spending distribution by category.
 * 
 * Displays a donut chart with each category's monthly cost, with a total
 * monthly spend shown in the center.
 */
export default function CategoryBreakdownChart({
  data,
  isLoading = false,
  error = null,
}: CategoryBreakdownChartProps) {
  const totalMonthly = data.reduce((sum, item) => sum + item.monthlyCost, 0);

  if (isLoading) {
    return (
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Spend by Category</h3>
          <p className="mt-1 text-sm text-gray-600">
            Monthly spending breakdown by subscription category.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
          <span className="ml-3 text-sm text-gray-600">Loading breakdown...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Spend by Category</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Spend by Category</h3>
          <p className="mt-1 text-sm text-gray-600">
            Monthly spending breakdown by subscription category.
          </p>
        </div>
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            No subscriptions yet. Add a subscription to see category breakdown.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Spend by Category</h3>
        <p className="mt-1 text-sm text-gray-600">
          Monthly spending breakdown by subscription category.
        </p>
      </div>
      <div className="px-6 py-4">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => {
                const percent = props.percent ?? 0;
                const category = props.category ?? '';
                return percent > 0.05 ? `${category}: ${(percent * 100).toFixed(0)}%` : '';
              }}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="monthlyCost"
              nameKey="category"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              formatter={(value: number, name: string) => {
                const percentage = totalMonthly > 0
                  ? ((value / totalMonthly) * 100).toFixed(1)
                  : '0';
                return [
                  `${formatCurrency(value)} (${percentage}%)`,
                  name || 'Category',
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <div className="text-2xl font-semibold text-gray-900">
            {formatCurrency(totalMonthly)}
          </div>
          <div className="text-sm text-gray-600">Total / month</div>
        </div>
      </div>
    </Card>
  );
}

