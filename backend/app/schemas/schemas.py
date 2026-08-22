import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


# ================= User & Auth Schemas =================
class UserRegister(BaseModel):
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6)
    first_name: str
    last_name: str
    phone: Optional[str] = ""
    city: Optional[str] = ""
    country: Optional[str] = "India"
    travel_style: Optional[str] = "Standard"
    budget_preference: Optional[str] = "Moderate"
    interests: Optional[str] = "History,Culture,Food"
    additional_info: Optional[str] = ""
    profile_photo: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str = Field(..., min_length=6)
    code: Optional[str] = None


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    language: Optional[str] = None
    travel_style: Optional[str] = None
    budget_preference: Optional[str] = None
    interests: Optional[str] = None
    profile_photo: Optional[str] = None


class UserPasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = ""
    city: Optional[str] = ""
    country: Optional[str] = "India"
    role: str
    profile_photo: Optional[str] = None
    language: str
    travel_style: str
    budget_preference: str
    interests: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ================= Activity Schemas =================
class ActivityBase(BaseModel):
    name: str
    category: str
    duration_hours: float = 2.0
    estimated_cost: float = 0.0
    rating: float = 4.5
    popularity_score: int = 80
    description: str
    image_url: str


class ActivityCreate(ActivityBase):
    city_id: int


class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    duration_hours: Optional[float] = None
    estimated_cost: Optional[float] = None
    rating: Optional[float] = None
    popularity_score: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class ActivityResponse(ActivityBase):
    id: int
    city_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ================= City Schemas =================
class CityBase(BaseModel):
    name: str
    state: str
    country: str = "India"
    region: str
    description: str
    image_url: str
    cost_index: str = "Moderate"
    popularity: int = 80
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    best_suited_interests: str = "Culture,Sightseeing"


class CityCreate(CityBase):
    pass


class CityUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    cost_index: Optional[str] = None
    popularity: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    best_suited_interests: Optional[str] = None


class CityResponse(CityBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class CityWithActivities(CityResponse):
    activities: List[ActivityResponse] = []


# ================= Trip Stop Schemas =================
class TripStopCreate(BaseModel):
    city_id: int
    arrival_date: datetime.date
    departure_date: datetime.date
    travel_mode: str = "Train"
    travel_cost: float = 0.0
    order_index: Optional[int] = 0
    notes: Optional[str] = ""


class TripStopUpdate(BaseModel):
    city_id: Optional[int] = None
    arrival_date: Optional[datetime.date] = None
    departure_date: Optional[datetime.date] = None
    travel_mode: Optional[str] = None
    travel_cost: Optional[float] = None
    order_index: Optional[int] = None
    notes: Optional[str] = None


class TripStopResponse(BaseModel):
    id: int
    trip_id: int
    city_id: int
    city: Optional[CityResponse] = None
    arrival_date: datetime.date
    departure_date: datetime.date
    travel_mode: str
    travel_cost: float
    order_index: int
    notes: Optional[str] = ""
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ================= Itinerary Activity Schemas =================
class ItineraryActivityCreate(BaseModel):
    stop_id: Optional[int] = None
    activity_id: Optional[int] = None
    custom_activity_name: Optional[str] = None
    date: datetime.date
    start_time: str = "10:00"
    end_time: str = "12:00"
    estimated_cost: float = 0.0
    notes: Optional[str] = ""
    order_index: Optional[int] = 0


class ItineraryActivityUpdate(BaseModel):
    date: Optional[datetime.date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    estimated_cost: Optional[float] = None
    notes: Optional[str] = None
    custom_activity_name: Optional[str] = None
    order_index: Optional[int] = None


class ItineraryActivityResponse(BaseModel):
    id: int
    trip_id: int
    stop_id: Optional[int] = None
    activity_id: Optional[int] = None
    activity: Optional[ActivityResponse] = None
    custom_activity_name: Optional[str] = None
    date: datetime.date
    start_time: str
    end_time: str
    estimated_cost: float
    notes: Optional[str] = ""
    order_index: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ReorderItem(BaseModel):
    id: int
    order_index: int


class ReorderRequest(BaseModel):
    items: List[ReorderItem]


# ================= Expense Schemas =================
class ExpenseCreate(BaseModel):
    category: str
    description: str
    amount: float
    date: datetime.date


class ExpenseResponse(BaseModel):
    id: int
    trip_id: int
    category: str
    description: str
    amount: float
    date: datetime.date
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ================= Trip Schemas =================
class TripCreate(BaseModel):
    title: str
    start_date: datetime.date
    end_date: datetime.date
    overall_budget: float = 30000.0
    travel_style: str = "Standard"
    description: Optional[str] = ""
    cover_image: Optional[str] = None


class TripUpdate(BaseModel):
    title: Optional[str] = None
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    overall_budget: Optional[float] = None
    travel_style: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    status: Optional[str] = None
    is_public: Optional[bool] = None


class TripResponse(BaseModel):
    id: int
    user_id: int
    title: str
    start_date: datetime.date
    end_date: datetime.date
    overall_budget: float
    travel_style: str
    description: Optional[str] = ""
    cover_image: Optional[str] = None
    status: str
    is_public: bool
    share_token: Optional[str] = None
    stops_count: int = 0
    duration_days: int = 0
    estimated_total_cost: float = 0.0
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class TripDetailResponse(TripResponse):
    stops: List[TripStopResponse] = []
    itinerary_activities: List[ItineraryActivityResponse] = []
    expenses: List[ExpenseResponse] = []
    user_name: Optional[str] = ""


# ================= Budget & Analytics Schemas =================
class CategoryCost(BaseModel):
    category: str
    amount: float
    percentage: float
    color: str


class DailyCost(BaseModel):
    day_number: int
    date: str
    city_name: str
    transport_cost: float
    accommodation_cost: float
    activity_cost: float
    food_cost: float
    other_cost: float
    total_cost: float


class BudgetSummaryResponse(BaseModel):
    overall_budget: float
    estimated_total: float
    remaining_budget: float
    is_overbudget: bool
    overbudget_amount: float
    overbudget_category: Optional[str] = None
    average_daily_cost: float
    duration_days: int
    breakdown_by_category: List[CategoryCost]
    daily_breakdown: List[DailyCost]
    formula_note: str


# ================= Conflict Detection Schemas =================
class ConflictWarning(BaseModel):
    date: str
    activity1_name: str
    activity1_time: str
    activity2_name: str
    activity2_time: str
    message: str


class ConflictCheckResponse(BaseModel):
    has_conflicts: bool
    conflicts: List[ConflictWarning]


# ================= Recommendation Schemas =================
class CityRecommendation(BaseModel):
    city: CityResponse
    match_score: int
    reason: str


class RecommendationResponse(BaseModel):
    user_interests: List[str]
    user_style: str
    recommended_cities: List[CityRecommendation]
    recommended_activities: List[ActivityResponse]


# ================= Favorite & Shared Schemas =================
class FavoriteCreate(BaseModel):
    item_type: str  # 'city', 'activity', 'trip'
    item_id: int


class FavoriteResponse(BaseModel):
    id: int
    item_type: str
    item_id: int
    created_at: datetime.datetime
    item_details: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class CommunityTripResponse(BaseModel):
    id: int
    share_token: str
    title: str
    author_name: str
    author_avatar: Optional[str] = None
    start_date: datetime.date
    end_date: datetime.date
    duration_days: int
    route_display: str
    cities_count: int
    travel_style: str
    overall_budget: float
    estimated_cost: float
    cover_image: Optional[str] = None
    description: Optional[str] = ""
    created_at: datetime.datetime


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ================= Admin Analytics Schemas =================
class AdminMetricsResponse(BaseModel):
    total_users: int
    total_trips: int
    total_cities: int
    total_activities: int
    total_public_trips: int
    average_trip_budget: float
    popular_cities: List[Dict[str, Any]]
    popular_categories: List[Dict[str, Any]]
    monthly_trip_growth: List[Dict[str, Any]]
