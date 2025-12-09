// TypeScript types matching the backend Pydantic schemas

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  next_billing_date: string | null; // ISO date string
  category: string | null;
  is_active: boolean;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface SubscriptionCreate {
  name: string;
  price: number;
  currency?: string;
  billing_cycle?: string;
  next_billing_date?: string | null;
  category?: string | null;
  is_active?: boolean;
}

export interface SubscriptionUpdate {
  name?: string;
  price?: number;
  currency?: string;
  billing_cycle?: string;
  next_billing_date?: string | null;
  category?: string | null;
  is_active?: boolean;
}

export interface SubscriptionSummary {
  total_active: number;
  total_monthly_cost: number;
  by_billing_cycle: {
    monthly: number;
    yearly: number;
    weekly: number;
  };
}

