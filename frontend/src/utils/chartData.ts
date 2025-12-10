import type { Subscription } from '../api/types';

export type BillingCycle = 'monthly' | 'yearly' | 'weekly';

export interface ForecastPoint {
  /** e.g. "2025-12" */
  monthKey: string;
  /** Human readable, e.g. "Dec 2025" */
  label: string;
  /** Actual monthly cost (float) for recurring payments in this month */
  totalMonthlyCost: number;
}

export interface CategoryBreakdownItem {
  category: string;
  /** Normalized monthly cost for this category */
  monthlyCost: number;
}

/**
 * Normalizes a subscription price to a monthly equivalent.
 * 
 * @param price - The subscription price
 * @param billingCycle - The billing cycle ("monthly", "yearly", or "weekly")
 * @returns The normalized monthly cost
 */
function normalizeSubscriptionToMonthly(
  price: number,
  billingCycle: BillingCycle
): number {
  switch (billingCycle) {
    case 'monthly':
      return price;
    case 'yearly':
      return price / 12;
    case 'weekly':
      return price * 4.345; // Average weeks per month
    default:
      // If billingCycle is unexpected, just return price
      return price;
  }
}

/**
 * Calculates the actual cost for a subscription in a specific month.
 * 
 * @param sub - Subscription object
 * @param monthDate - Date representing the first day of the month to calculate for
 * @param baseDate - Date representing the start of the forecast (current month)
 * @returns The actual cost for this subscription in this month, or 0 if not charging
 */
function getSubscriptionCostForMonth(
  sub: Subscription,
  monthDate: Date,
  baseDate: Date
): number {
  const cycle = sub.billing_cycle.toLowerCase() as BillingCycle;
  const monthYear = monthDate.getFullYear();
  const month = monthDate.getMonth();
  
  switch (cycle) {
    case 'monthly':
      // Monthly subscriptions charge every month
      return sub.price;
      
    case 'yearly': {
      // Yearly subscriptions charge once per year
      // Use next_billing_date to determine when it charges
      let billingDate: Date;
      
      if (sub.next_billing_date) {
        billingDate = new Date(sub.next_billing_date);
      } else if (sub.created_at) {
        // If no next_billing_date, use created_at as the base
        billingDate = new Date(sub.created_at);
      } else {
        // Fallback: assume it charges in the base month
        billingDate = new Date(baseDate);
      }
      
      const billingYear = billingDate.getFullYear();
      const billingMonth = billingDate.getMonth();
      
      // Check if this forecast month matches the billing month
      if (month === billingMonth && monthYear === billingYear) {
        return sub.price;
      }
      
      // Calculate if this month is a yearly renewal
      // Find all future billing dates (every 12 months from the base billing date)
      const monthsFromBilling = (monthYear - billingYear) * 12 + (month - billingMonth);
      
      // Check if this is exactly 12, 24, 36, etc. months from the billing date
      if (monthsFromBilling > 0 && monthsFromBilling % 12 === 0) {
        return sub.price;
      }
      
      return 0;
    }
    
    case 'weekly': {
      // Weekly subscriptions: calculate how many times it charges in this month
      // Get first and last day of the month
      const firstDay = new Date(monthYear, month, 1);
      const lastDay = new Date(monthYear, month + 1, 0);
      
      // Determine the start date for weekly charges
      let startDate: Date;
      if (sub.next_billing_date) {
        startDate = new Date(sub.next_billing_date);
      } else if (sub.created_at) {
        startDate = new Date(sub.created_at);
      } else {
        startDate = new Date(baseDate);
      }
      
      // Find the first charge date in or before this month
      let checkDate = new Date(startDate);
      while (checkDate < firstDay) {
        checkDate.setDate(checkDate.getDate() + 7);
      }
      
      // If the first charge date is before this month, find the first one in this month
      if (checkDate < firstDay) {
        // Calculate how many weeks to add to get into this month
        const daysDiff = (firstDay.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24);
        const weeksToAdd = Math.ceil(daysDiff / 7);
        checkDate.setDate(checkDate.getDate() + (weeksToAdd * 7));
      }
      
      // Count charges within this month
      let chargeCount = 0;
      while (checkDate <= lastDay && checkDate.getMonth() === month) {
        chargeCount++;
        checkDate.setDate(checkDate.getDate() + 7);
      }
      
      return sub.price * chargeCount;
    }
    
    default:
      // Unknown cycle, assume monthly
      return sub.price;
  }
}

/**
 * Builds a spending forecast for the next N months based on active subscriptions.
 * 
 * Generates one ForecastPoint per month, showing the actual recurring payment
 * amount for that month (not normalized). Monthly subscriptions charge every month,
 * yearly subscriptions charge once per year, weekly subscriptions charge based on
 * weeks in that month.
 * 
 * @param subscriptions - Array of subscription objects
 * @param options - Optional configuration (months to forecast, base date)
 * @returns Array of ForecastPoint objects, one per month
 */
export function buildSpendingForecast(
  subscriptions: Subscription[],
  options?: { months?: number; now?: Date }
): ForecastPoint[] {
  const months = options?.months ?? 12;
  const now = options?.now ?? new Date();
  
  // Start from the beginning of the current month
  const baseDate = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Filter to only active subscriptions
  const activeSubs = subscriptions.filter((sub) => sub.is_active === true);
  
  // Generate forecast points
  const result: ForecastPoint[] = [];
  for (let i = 0; i < months; i++) {
    const monthDate = new Date(baseDate);
    monthDate.setMonth(monthDate.getMonth() + i);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const label = monthDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    
    // Calculate total cost for this month by summing actual charges
    let totalCost = 0;
    for (const sub of activeSubs) {
      totalCost += getSubscriptionCostForMonth(sub, monthDate, baseDate);
    }
    
    result.push({
      monthKey,
      label,
      totalMonthlyCost: Math.round(totalCost * 100) / 100,
    });
  }
  
  return result;
}

/**
 * Builds a category breakdown of spending from active subscriptions.
 * 
 * Groups subscriptions by category, normalizes all prices to monthly equivalents,
 * and sums the costs per category. Returns results sorted by monthly cost descending.
 * 
 * @param subscriptions - Array of subscription objects
 * @returns Array of CategoryBreakdownItem objects, sorted by monthlyCost descending
 */
export function buildCategoryBreakdown(
  subscriptions: Subscription[]
): CategoryBreakdownItem[] {
  // Filter to only active subscriptions
  const activeSubs = subscriptions.filter((sub) => sub.is_active === true);
  
  if (activeSubs.length === 0) {
    return [];
  }
  
  // Map to accumulate costs per category
  const categoryMap = new Map<string, number>();
  
  for (const sub of activeSubs) {
    const category = sub.category && sub.category.trim() !== '' 
      ? sub.category 
      : 'Uncategorized';
    
    const normalizedMonthly = normalizeSubscriptionToMonthly(
      sub.price,
      sub.billing_cycle as BillingCycle
    );
    
    const current = categoryMap.get(category) ?? 0;
    categoryMap.set(category, current + normalizedMonthly);
  }
  
  // Convert to array and round to 2 decimal places
  const result: CategoryBreakdownItem[] = Array.from(categoryMap.entries()).map(
    ([category, monthlyCost]) => ({
      category,
      monthlyCost: Math.round(monthlyCost * 100) / 100,
    })
  );
  
  // Sort by monthlyCost descending
  result.sort((a, b) => b.monthlyCost - a.monthlyCost);
  
  return result;
}

// Development-only tests
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // Test normalizeSubscriptionToMonthly
  console.assert(
    normalizeSubscriptionToMonthly(12, 'monthly') === 12,
    'Monthly normalization should return price as-is'
  );
  console.assert(
    Math.abs(normalizeSubscriptionToMonthly(120, 'yearly') - 10) < 0.01,
    'Yearly normalization should divide by 12'
  );
  console.assert(
    Math.abs(normalizeSubscriptionToMonthly(10, 'weekly') - 43.45) < 0.01,
    'Weekly normalization should multiply by 4.345'
  );
  
  // Test buildSpendingForecast with empty array
  const emptyForecast = buildSpendingForecast([]);
  console.assert(
    emptyForecast.length === 12,
    'Empty forecast should return 12 months'
  );
  console.assert(
    emptyForecast.every((p) => p.totalMonthlyCost === 0),
    'Empty forecast should have zero costs'
  );
  
  // Test buildCategoryBreakdown with empty array
  const emptyBreakdown = buildCategoryBreakdown([]);
  console.assert(
    emptyBreakdown.length === 0,
    'Empty breakdown should return empty array'
  );
  
  console.log('✅ chartData.ts tests passed');
}
