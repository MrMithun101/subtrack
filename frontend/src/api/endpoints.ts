import apiClient from './client';
import type {
  User,
  UserCreate,
  LoginRequest,
  LoginResponse,
  Subscription,
  SubscriptionCreate,
  SubscriptionUpdate,
  SubscriptionSummary,
} from './types';

// ==================== Auth Endpoints ====================

export const auth = {
  /**
   * Register a new user
   */
  register: async (data: UserCreate): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  /**
   * Login and get access token
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Get current user info (requires authentication)
   */
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};

// ==================== Subscription Endpoints ====================

export const subscriptions = {
  /**
   * Get all subscriptions for the current user
   */
  list: async (): Promise<Subscription[]> => {
    const response = await apiClient.get<Subscription[]>('/subscriptions');
    return response.data;
  },

  /**
   * Get subscription summary (total_active, total_monthly_cost, by_billing_cycle)
   */
  getSummary: async (): Promise<SubscriptionSummary> => {
    const response = await apiClient.get<SubscriptionSummary>('/subscriptions/summary');
    return response.data;
  },

  /**
   * Get a specific subscription by ID
   */
  get: async (id: number): Promise<Subscription> => {
    const response = await apiClient.get<Subscription>(`/subscriptions/${id}`);
    return response.data;
  },

  /**
   * Create a new subscription
   */
  create: async (data: SubscriptionCreate): Promise<Subscription> => {
    const response = await apiClient.post<Subscription>('/subscriptions', data);
    return response.data;
  },

  /**
   * Update a subscription (partial update)
   */
  update: async (id: number, data: SubscriptionUpdate): Promise<Subscription> => {
    const response = await apiClient.put<Subscription>(`/subscriptions/${id}`, data);
    return response.data;
  },

  /**
   * Delete a subscription
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/subscriptions/${id}`);
  },
};
