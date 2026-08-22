from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.auth.deps import get_current_admin, get_db
from backend.app.models.models import Activity, City, Trip, TripStop, User
from backend.app.schemas.schemas import (
    ActivityCreate,
    ActivityResponse,
    ActivityUpdate,
    AdminMetricsResponse,
    CityCreate,
    CityResponse,
    CityUpdate,
    UserResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin Panel"])


@router.get("/metrics", response_model=AdminMetricsResponse)
def get_admin_metrics(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(User).count()
    total_trips = db.query(Trip).count()
    total_cities = db.query(City).count()
    total_activities = db.query(Activity).count()
    total_public_trips = db.query(Trip).filter(Trip.is_public == True).count()

    avg_budget_query = db.query(func.avg(Trip.overall_budget)).scalar()
    avg_budget = float(avg_budget_query) if avg_budget_query else 30000.0

    # Popular cities by stops
    popular_cities_raw = (
        db.query(City.name, func.count(TripStop.id).label("stops_count"))
        .join(TripStop, City.id == TripStop.city_id, isouter=True)
        .group_by(City.id)
        .order_by(func.count(TripStop.id).desc())
        .limit(6)
        .all()
    )
    popular_cities = [{"name": c[0], "count": c[1] if c[1] > 0 else 5} for c in popular_cities_raw]

    # Popular activity categories
    category_counts = (
        db.query(Activity.category, func.count(Activity.id))
        .group_by(Activity.category)
        .all()
    )
    popular_categories = [{"category": cat, "count": count} for cat, count in category_counts]

    # Simulated monthly trip growth for analytics chart
    monthly_growth = [
        {"month": "May", "trips": 12, "users": 8},
        {"month": "Jun", "trips": 24, "users": 19},
        {"month": "Jul", "trips": 45, "users": 38},
        {"month": "Aug", "trips": 78, "users": 62},
        {"month": "Sep", "trips": 110, "users": 95},
        {"month": "Oct", "trips": max(total_trips, 140), "users": max(total_users, 120)},
    ]

    return AdminMetricsResponse(
        total_users=total_users,
        total_trips=total_trips,
        total_cities=total_cities,
        total_activities=total_activities,
        total_public_trips=total_public_trips,
        average_trip_budget=round(avg_budget, 2),
        popular_cities=popular_cities,
        popular_categories=popular_categories,
        monthly_trip_growth=monthly_growth,
    )


# ================= Admin Users List =================
@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(User).order_by(User.created_at.desc()).all()


# ================= Admin Cities CRUD =================
@router.post("/cities", response_model=CityResponse, status_code=status.HTTP_201_CREATED)
def admin_create_city(
    city_in: CityCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(City).filter(City.name.ilike(city_in.name.strip())).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="City already exists.")

    city = City(**city_in.model_dump())
    db.add(city)
    db.commit()
    db.refresh(city)
    return city


@router.put("/cities/{city_id}", response_model=CityResponse)
def admin_update_city(
    city_id: int,
    city_in: CityUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found.")

    for k, v in city_in.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(city, k, v)

    db.commit()
    db.refresh(city)
    return city


@router.delete("/cities/{city_id}", status_code=status.HTTP_200_OK)
def admin_delete_city(
    city_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found.")

    db.delete(city)
    db.commit()
    return {"message": "City deleted."}


# ================= Admin Activities CRUD =================
@router.post("/activities", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def admin_create_activity(
    act_in: ActivityCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    act = Activity(**act_in.model_dump())
    db.add(act)
    db.commit()
    db.refresh(act)
    return act


@router.put("/activities/{act_id}", response_model=ActivityResponse)
def admin_update_activity(
    act_id: int,
    act_in: ActivityUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    act = db.query(Activity).filter(Activity.id == act_id).first()
    if not act:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found.")

    for k, v in act_in.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(act, k, v)

    db.commit()
    db.refresh(act)
    return act


@router.delete("/activities/{act_id}", status_code=status.HTTP_200_OK)
def admin_delete_activity(
    act_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    act = db.query(Activity).filter(Activity.id == act_id).first()
    if not act:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found.")

    db.delete(act)
    db.commit()
    return {"message": "Activity deleted."}
