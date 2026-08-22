import datetime
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False, default="")
    last_name = Column(String(100), nullable=False, default="")
    phone = Column(String(50), nullable=True, default="")
    city = Column(String(100), nullable=True, default="")
    country = Column(String(100), nullable=True, default="India")
    role = Column(String(20), default="user", index=True)  # 'user' or 'admin'
    profile_photo = Column(String(500), nullable=True)
    language = Column(String(50), default="English")
    travel_style = Column(String(50), default="Standard")  # Budget, Standard, Premium, Luxury
    budget_preference = Column(String(50), default="Moderate")
    interests = Column(Text, default="History,Culture,Food")  # comma-separated
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    state = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False, default="India")
    region = Column(String(50), nullable=False, index=True)  # North, South, West, East, Central, North-East
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=False)
    cost_index = Column(String(50), default="Moderate")  # Budget, Moderate, Luxury
    popularity = Column(Integer, default=80)  # 1 to 100
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    best_suited_interests = Column(String(255), default="Culture,Sightseeing")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    activities = relationship("Activity", back_populates="city", cascade="all, delete-orphan")
    stops = relationship("TripStop", back_populates="city")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # Sightseeing, Food, Culture, Adventure, Shopping, Nature, Entertainment, Photography
    duration_hours = Column(Float, default=2.0)
    estimated_cost = Column(Float, default=500.0)
    rating = Column(Float, default=4.5)
    popularity_score = Column(Integer, default=85)
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    city = relationship("City", back_populates="activities")
    itinerary_entries = relationship("ItineraryActivity", back_populates="activity")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    overall_budget = Column(Float, default=30000.0)
    travel_style = Column(String(50), default="Standard")  # Budget, Standard, Premium, Luxury
    description = Column(Text, nullable=True, default="")
    cover_image = Column(String(500), nullable=True)
    status = Column(String(50), default="upcoming", index=True)  # upcoming, ongoing, completed
    is_public = Column(Boolean, default=False, index=True)
    share_token = Column(String(100), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="trips")
    stops = relationship("TripStop", back_populates="trip", cascade="all, delete-orphan", order_by="TripStop.order_index")
    itinerary_activities = relationship("ItineraryActivity", back_populates="trip", cascade="all, delete-orphan", order_by="ItineraryActivity.order_index")
    expenses = relationship("Expense", back_populates="trip", cascade="all, delete-orphan")
    shared_record = relationship("SharedTrip", back_populates="trip", uselist=False, cascade="all, delete-orphan")


class TripStop(Base):
    __tablename__ = "trip_stops"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False, index=True)
    arrival_date = Column(Date, nullable=False)
    departure_date = Column(Date, nullable=False)
    travel_mode = Column(String(50), default="Train")  # Flight, Train, Bus, Car, Other
    travel_cost = Column(Float, default=0.0)
    order_index = Column(Integer, default=0)
    notes = Column(Text, nullable=True, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    trip = relationship("Trip", back_populates="stops")
    city = relationship("City", back_populates="stops")
    itinerary_activities = relationship("ItineraryActivity", back_populates="stop", cascade="all, delete-orphan")


class ItineraryActivity(Base):
    __tablename__ = "itinerary_activities"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    stop_id = Column(Integer, ForeignKey("trip_stops.id", ondelete="CASCADE"), nullable=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="SET NULL"), nullable=True, index=True)
    custom_activity_name = Column(String(200), nullable=True)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(String(20), default="10:00")  # e.g., "10:00"
    end_time = Column(String(20), default="12:00")    # e.g., "12:00"
    estimated_cost = Column(Float, default=0.0)
    notes = Column(Text, nullable=True, default="")
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    trip = relationship("Trip", back_populates="itinerary_activities")
    stop = relationship("TripStop", back_populates="itinerary_activities")
    activity = relationship("Activity", back_populates="itinerary_entries")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # Transport, Accommodation, Activities, Food, Other
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    trip = relationship("Trip", back_populates="expenses")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    item_type = Column(String(50), nullable=False, index=True)  # 'city', 'activity', 'trip'
    item_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="favorites")


class SharedTrip(Base):
    __tablename__ = "shared_trips"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    share_token = Column(String(100), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    trip = relationship("Trip", back_populates="shared_record")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, warning, success, alert
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
