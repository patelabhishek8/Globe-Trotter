from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from backend.app.auth.deps import get_current_user, get_db
from backend.app.models.models import (
    ItineraryActivity,
    Trip,
    TripStop,
    User,
)
from backend.app.schemas.schemas import (
    CommunityTripResponse,
    TripDetailResponse,
    TripResponse,
)
from backend.app.services.budget_service import calculate_trip_budget

router = APIRouter(prefix="/community", tags=["Community & Sharing"])


@router.get("", response_model=List[CommunityTripResponse])
def get_community_trips(
    search: Optional[str] = Query(None, description="Search public trips"),
    sort_by: Optional[str] = Query("latest", description="latest, popular, budget"),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Trip)
        .options(
            joinedload(Trip.user),
            joinedload(Trip.stops).joinedload(TripStop.city),
        )
        .filter(Trip.is_public == True)
    )

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter((Trip.title.ilike(pattern)) | (Trip.description.ilike(pattern)))

    trips = query.all()
    results: List[CommunityTripResponse] = []

    for t in trips:
        duration = max(1, (t.end_date - t.start_date).days + 1)
        # build route display e.g. "Ahmedabad → Udaipur → Jaipur"
        ordered_stops = sorted(t.stops, key=lambda s: s.order_index)
        city_names = [s.city.name for s in ordered_stops if s.city]
        route_str = " → ".join(city_names) if city_names else "Multi-city journey"

        budget_summary = calculate_trip_budget(t, db)

        author_name = f"{t.user.first_name} {t.user.last_name[:1]}." if (t.user and t.user.first_name) else "GlobeTrotter Explorer"

        results.append(
            CommunityTripResponse(
                id=t.id,
                share_token=t.share_token or str(t.id),
                title=t.title,
                author_name=author_name,
                author_avatar=t.user.profile_photo if t.user else None,
                start_date=t.start_date,
                end_date=t.end_date,
                duration_days=duration,
                route_display=route_str,
                cities_count=len(ordered_stops),
                travel_style=t.travel_style or "Standard",
                overall_budget=t.overall_budget,
                estimated_cost=budget_summary.estimated_total,
                cover_image=t.cover_image or "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80",
                description=t.description or "",
                created_at=t.created_at,
            )
        )

    if sort_by == "budget":
        results.sort(key=lambda x: x.estimated_cost)
    elif sort_by == "popular":
        results.sort(key=lambda x: x.cities_count, reverse=True)
    else:  # latest
        results.sort(key=lambda x: x.created_at, reverse=True)

    return results


@router.get("/shared/{token}", response_model=TripDetailResponse)
def get_shared_public_trip(token: str, db: Session = Depends(get_db)):
    trip = (
        db.query(Trip)
        .options(
            joinedload(Trip.stops).joinedload(TripStop.city),
            joinedload(Trip.itinerary_activities).joinedload(ItineraryActivity.activity),
            joinedload(Trip.expenses),
            joinedload(Trip.user),
        )
        .filter(Trip.share_token == token, Trip.is_public == True)
        .first()
    )
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public trip not found or link has expired.",
        )

    duration = max(1, (trip.end_date - trip.start_date).days + 1)
    stops_count = len(trip.stops)
    budget_summary = calculate_trip_budget(trip, db)

    resp = TripDetailResponse.model_validate(trip)
    resp.duration_days = duration
    resp.stops_count = stops_count
    resp.estimated_total_cost = budget_summary.estimated_total
    resp.user_name = f"{trip.user.first_name} {trip.user.last_name[:1]}." if trip.user else "Explorer"
    return resp


@router.post("/shared/{token}/copy", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def copy_public_trip_to_account(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    source_trip = (
        db.query(Trip)
        .options(
            joinedload(Trip.stops),
            joinedload(Trip.itinerary_activities),
        )
        .filter(Trip.share_token == token, Trip.is_public == True)
        .first()
    )
    if not source_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public trip not found or sharing has been disabled.",
        )

    new_trip = Trip(
        user_id=current_user.id,
        title=f"{source_trip.title} (My Plan)",
        start_date=source_trip.start_date,
        end_date=source_trip.end_date,
        overall_budget=source_trip.overall_budget,
        travel_style=source_trip.travel_style,
        description=source_trip.description,
        cover_image=source_trip.cover_image,
        status="upcoming",
        is_public=False,
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    stop_id_map = {}
    for s in source_trip.stops:
        new_stop = TripStop(
            trip_id=new_trip.id,
            city_id=s.city_id,
            arrival_date=s.arrival_date,
            departure_date=s.departure_date,
            travel_mode=s.travel_mode,
            travel_cost=s.travel_cost,
            order_index=s.order_index,
            notes=s.notes,
        )
        db.add(new_stop)
        db.commit()
        db.refresh(new_stop)
        stop_id_map[s.id] = new_stop.id

    for a in source_trip.itinerary_activities:
        new_act = ItineraryActivity(
            trip_id=new_trip.id,
            stop_id=stop_id_map.get(a.stop_id) if a.stop_id else None,
            activity_id=a.activity_id,
            custom_activity_name=a.custom_activity_name,
            date=a.date,
            start_time=a.start_time,
            end_time=a.end_time,
            estimated_cost=a.estimated_cost,
            notes=a.notes,
            order_index=a.order_index,
        )
        db.add(new_act)

    db.commit()

    duration = max(1, (new_trip.end_date - new_trip.start_date).days + 1)
    budget_summary = calculate_trip_budget(new_trip, db)
    resp = TripResponse.model_validate(new_trip)
    resp.duration_days = duration
    resp.stops_count = len(new_trip.stops)
    resp.estimated_total_cost = budget_summary.estimated_total
    return resp
