export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  city?: string;
  country?: string;
  role: 'user' | 'admin';
  profile_photo?: string;
  language: string;
  travel_style: string;
  budget_preference: string;
  interests: string;
  created_at: string;
}

export interface City {
  id: number;
  name: string;
  state: string;
  country: string;
  region: string;
  description: string;
  image_url: string;
  cost_index: string;
  popularity: number;
  latitude?: number;
  longitude?: number;
  best_suited_interests: string;
  created_at?: string;
}

export interface CityWithActivities extends City {
  activities: Activity[];
}

export interface Activity {
  id: number;
  city_id: number;
  name: string;
  category: string;
  duration_hours: number;
  estimated_cost: number;
  rating: number;
  popularity_score: number;
  description: string;
  image_url: string;
  created_at?: string;
}

export interface TripStop {
  id: number;
  trip_id: number;
  city_id: number;
  city?: City;
  arrival_date: string;
  departure_date: string;
  travel_mode: 'Flight' | 'Train' | 'Bus' | 'Car' | 'Other';
  travel_cost: number;
  order_index: number;
  notes?: string;
  created_at?: string;
}

export interface ItineraryActivity {
  id: number;
  trip_id: number;
  stop_id?: number;
  activity_id?: number;
  activity?: Activity;
  custom_activity_name?: string;
  date: string;
  start_time: string;
  end_time: string;
  estimated_cost: number;
  notes?: string;
  order_index: number;
  created_at?: string;
}

export interface Expense {
  id: number;
  trip_id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  created_at?: string;
}

export interface Trip {
  id: number;
  user_id: number;
  title: string;
  start_date: string;
  end_date: string;
  overall_budget: number;
  travel_style: string;
  description?: string;
  cover_image?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  is_public: boolean;
  share_token?: string;
  stops_count?: number;
  duration_days?: number;
  estimated_total_cost?: number;
  created_at: string;
  updated_at?: string;
}

export interface TripDetail extends Trip {
  stops: TripStop[];
  itinerary_activities: ItineraryActivity[];
  expenses: Expense[];
  user_name?: string;
}

export interface CategoryCost {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface DailyCost {
  day_number: number;
  date: string;
  city_name: string;
  transport_cost: number;
  accommodation_cost: number;
  activity_cost: number;
  food_cost: number;
  other_cost: number;
  total_cost: number;
}

export interface BudgetSummary {
  overall_budget: number;
  estimated_total: number;
  remaining_budget: number;
  is_overbudget: boolean;
  overbudget_amount: number;
  overbudget_category?: string;
  average_daily_cost: number;
  duration_days: number;
  breakdown_by_category: CategoryCost[];
  daily_breakdown: DailyCost[];
  formula_note: string;
}

export interface ConflictWarning {
  date: string;
  activity1_name: string;
  activity1_time: string;
  activity2_name: string;
  activity2_time: string;
  message: string;
}

export interface ConflictCheckResult {
  has_conflicts: boolean;
  conflicts: ConflictWarning[];
}

export interface CityRecommendation {
  city: City;
  match_score: number;
  reason: string;
}

export interface RecommendationData {
  user_interests: string[];
  user_style: string;
  recommended_cities: CityRecommendation[];
  recommended_activities: Activity[];
}

export interface FavoriteItem {
  id: number;
  item_type: 'city' | 'activity' | 'trip';
  item_id: number;
  created_at: string;
  item_details?: any;
}

export interface CommunityTrip {
  id: number;
  share_token: string;
  title: string;
  author_name: string;
  author_avatar?: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  route_display: string;
  cities_count: number;
  travel_style: string;
  overall_budget: number;
  estimated_cost: number;
  cover_image?: string;
  description?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  is_read: boolean;
  created_at: string;
}

export interface AdminMetrics {
  total_users: number;
  total_trips: number;
  total_cities: number;
  total_activities: number;
  total_public_trips: number;
  average_trip_budget: number;
  popular_cities: { name: string; count: number }[];
  popular_categories: { category: string; count: number }[];
  monthly_trip_growth: { month: string; trips: number; users: number }[];
}
