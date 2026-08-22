import {
  Activity,
  AdminMetrics,
  BudgetSummary,
  City,
  CommunityTrip,
  ConflictCheckResult,
  Expense,
  FavoriteItem,
  ItineraryActivity,
  NotificationItem,
  RecommendationData,
  Trip,
  TripDetail,
  TripStop,
  User,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('globetrotter_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await response.json();
      errorMsg = data.detail || data.message || errorMsg;
    } catch {
      errorMsg = response.statusText;
    }
    throw new Error(errorMsg);
  }

  // If 204 or empty response
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: any) => request<{ access_token: string; token_type: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  login: (data: any) => request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  forgotPassword: (email: string) => request<{ message: string; verification_code: string; email: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  resetPassword: (data: { email: string; new_password: string; code?: string }) => request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMe: () => request<User>('/auth/me'),
  updateProfile: (data: Partial<User>) => request<User>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  changePassword: (data: any) => request<{ message: string }>('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Trips
  getTrips: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return request<Trip[]>(`/trips?${query.toString()}`);
  },
  getTripDetail: (id: number) => request<TripDetail>(`/trips/${id}`),
  createTrip: (data: any) => request<Trip>('/trips', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateTrip: (id: number, data: Partial<Trip>) => request<Trip>(`/trips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteTrip: (id: number) => request<{ message: string }>(`/trips/${id}`, {
    method: 'DELETE',
  }),
  duplicateTrip: (id: number) => request<Trip>(`/trips/${id}/duplicate`, {
    method: 'POST',
  }),

  // Stops
  addStop: (tripId: number, data: any) => request<TripStop>(`/trips/${tripId}/stops`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStop: (tripId: number, stopId: number, data: any) => request<TripStop>(`/trips/${tripId}/stops/${stopId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteStop: (tripId: number, stopId: number) => request<{ message: string }>(`/trips/${tripId}/stops/${stopId}`, {
    method: 'DELETE',
  }),
  reorderStops: (tripId: number, items: { id: number; order_index: number }[]) => request<{ message: string }>(`/trips/${tripId}/stops/reorder`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  }),

  // Itinerary Activities
  addItineraryActivity: (tripId: number, data: any) => request<ItineraryActivity>(`/trips/${tripId}/activities`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateItineraryActivity: (tripId: number, actId: number, data: any) => request<ItineraryActivity>(`/trips/${tripId}/activities/${actId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteItineraryActivity: (tripId: number, actId: number) => request<{ message: string }>(`/trips/${tripId}/activities/${actId}`, {
    method: 'DELETE',
  }),
  reorderItineraryActivities: (tripId: number, items: { id: number; order_index: number }[]) => request<{ message: string }>(`/trips/${tripId}/activities/reorder`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  }),
  getTripConflicts: (tripId: number) => request<ConflictCheckResult>(`/trips/${tripId}/conflicts`),

  // Budget & Expenses
  getTripBudget: (tripId: number) => request<BudgetSummary>(`/trips/${tripId}/budget`),
  addTripExpense: (tripId: number, data: any) => request<Expense>(`/trips/${tripId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteTripExpense: (tripId: number, expId: number) => request<{ message: string }>(`/trips/${tripId}/expenses/${expId}`, {
    method: 'DELETE',
  }),

  // Sharing
  toggleShareTrip: (tripId: number) => request<{ is_public: boolean; share_token: string; public_url: string }>(`/trips/${tripId}/share`, {
    method: 'POST',
  }),
  getSharedTrip: (token: string) => request<TripDetail>(`/community/shared/${token}`),
  copySharedTrip: (token: string) => request<Trip>(`/community/shared/${token}/copy`, {
    method: 'POST',
  }),

  // Cities & Activities
  getCities: (params?: { search?: string; region?: string; cost_index?: string; sort_by?: string; order?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.region) query.append('region', params.region);
    if (params?.cost_index) query.append('cost_index', params.cost_index);
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.order) query.append('order', params.order);
    return request<City[]>(`/cities?${query.toString()}`);
  },
  getCityDetails: (id: number) => request<City & { activities: Activity[] }>(`/cities/${id}`),
  getActivities: (params?: { search?: string; city_id?: number; category?: string; max_cost?: number; sort_by?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.city_id) query.append('city_id', params.city_id.toString());
    if (params?.category) query.append('category', params.category);
    if (params?.max_cost) query.append('max_cost', params.max_cost.toString());
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    return request<Activity[]>(`/activities?${query.toString()}`);
  },

  // Recommendations
  getRecommendations: () => request<RecommendationData>('/recommendations'),

  // Favorites
  getFavorites: () => request<FavoriteItem[]>('/favorites'),
  addFavorite: (item_type: 'city' | 'activity' | 'trip', item_id: number) => request<FavoriteItem>('/favorites', {
    method: 'POST',
    body: JSON.stringify({ item_type, item_id }),
  }),
  removeFavorite: (favId: number) => request<{ message: string }>(`/favorites/${favId}`, {
    method: 'DELETE',
  }),

  // Community
  getCommunityTrips: (params?: { search?: string; sort_by?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    return request<CommunityTrip[]>(`/community?${query.toString()}`);
  },

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: number) => request<NotificationItem>(`/notifications/${id}/read`, {
    method: 'PUT',
  }),
  markAllNotificationsRead: () => request<{ message: string }>('/notifications/read-all', {
    method: 'PUT',
  }),

  // Admin
  getAdminMetrics: () => request<AdminMetrics>('/admin/metrics'),
  getAdminUsers: () => request<User[]>('/admin/users'),
  adminCreateCity: (data: any) => request<City>('/admin/cities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  adminUpdateCity: (id: number, data: any) => request<City>(`/admin/cities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  adminDeleteCity: (id: number) => request<{ message: string }>(`/admin/cities/${id}`, {
    method: 'DELETE',
  }),
  adminCreateActivity: (data: any) => request<Activity>('/admin/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  adminUpdateActivity: (id: number, data: any) => request<Activity>(`/admin/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  adminDeleteActivity: (id: number) => request<{ message: string }>(`/admin/activities/${id}`, {
    method: 'DELETE',
  }),
};
