import datetime
import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from backend.app.auth.deps import get_current_user, get_db
from backend.app.models.models import (
    Activity,
    City,
    Expense,
    ItineraryActivity,
    Notification,
    SharedTrip,
    Trip,
    TripStop,
    User,
)
from backend.app.schemas.schemas import (
    BudgetSummaryResponse,
    ConflictCheckResponse,
    ExpenseCreate,
    ExpenseResponse,
    ItineraryActivityCreate,
    ItineraryActivityResponse,
    ItineraryActivityUpdate,
    ReorderRequest,
    TripCreate,
    TripDetailResponse,
    TripResponse,
    TripStopCreate,
    TripStopResponse,
    TripStopUpdate,
    TripUpdate,
)
from backend.app.services.budget_service import calculate_trip_budget
from backend.app.services.conflict_service import check_itinerary_conflicts

router = APIRouter(prefix="/trips", tags=["Trips"])


def _calculate_trip_stats(trip: Trip, db: Session) -> dict:
    duration = max(1, (trip.end_date - trip.start_date).days + 1)
    stops_count = db.query(TripStop).filter(TripStop.trip_id == trip.id).count()
    budget_summary = calculate_trip_budget(trip, db)
    return {
        "duration_days": duration,
        "stops_count": stops_count,
        "estimated_total_cost": budget_summary.estimated_total,
    }


# ================= Trips CRUD =================
@router.get("", response_model=List[TripResponse])
def get_user_trips(
    status_filter: Optional[str] = Query(None, alias="status", description="all, upcoming, ongoing, completed"),
    search: Optional[str] = Query(None, description="Search trips by title or description"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Trip).filter(Trip.user_id == current_user.id)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Trip.status == status_filter.lower())

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter((Trip.title.ilike(search_pattern)) | (Trip.description.ilike(search_pattern)))

    trips = query.order_by(Trip.start_date.desc()).all()
    results = []
    for trip in trips:
        stats = _calculate_trip_stats(trip, db)
        data = TripResponse.model_validate(trip)
        data.duration_days = stats["duration_days"]
        data.stops_count = stats["stops_count"]
        data.estimated_total_cost = stats["estimated_total_cost"]
        results.append(data)

    return results


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(
    trip_in: TripCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if trip_in.end_date < trip_in.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date cannot be earlier than start date.",
        )
    if trip_in.overall_budget < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Overall budget cannot be negative.",
        )

    # Determine initial status
    today = datetime.date.today()
    if trip_in.end_date < today:
        trip_status = "completed"
    elif trip_in.start_date <= today <= trip_in.end_date:
        trip_status = "ongoing"
    else:
        trip_status = "upcoming"

    cover = trip_in.cover_image or "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80"

    trip = Trip(
        user_id=current_user.id,
        title=trip_in.title,
        start_date=trip_in.start_date,
        end_date=trip_in.end_date,
        overall_budget=trip_in.overall_budget,
        travel_style=trip_in.travel_style,
        description=trip_in.description or "",
        cover_image=cover,
        status=trip_status,
        is_public=False,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)

    # Add notification
    notif = Notification(
        user_id=current_user.id,
        title=f"Trip '{trip.title}' Created! ✈️",
        message="Start adding destination stops and activities in the Itinerary Builder.",
        type="success",
    )
    db.add(notif)
    db.commit()

    stats = _calculate_trip_stats(trip, db)
    resp = TripResponse.model_validate(trip)
    resp.duration_days = stats["duration_days"]
    resp.stops_count = stats["stops_count"]
    resp.estimated_total_cost = stats["estimated_total_cost"]
    return resp


@router.get("/{trip_id}", response_model=TripDetailResponse)
def get_trip_detail(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = (
        db.query(Trip)
        .options(
            joinedload(Trip.stops).joinedload(TripStop.city),
            joinedload(Trip.itinerary_activities).joinedload(ItineraryActivity.activity),
            joinedload(Trip.expenses),
            joinedload(Trip.user),
        )
        .filter(Trip.id == trip_id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    if trip.user_id != current_user.id and current_user.role != "admin" and not trip.is_public:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this private trip")

    stats = _calculate_trip_stats(trip, db)
    resp = TripDetailResponse.model_validate(trip)
    resp.duration_days = stats["duration_days"]
    resp.stops_count = stats["stops_count"]
    resp.estimated_total_cost = stats["estimated_total_cost"]
    resp.user_name = f"{trip.user.first_name} {trip.user.last_name}".strip() if trip.user else "Traveler"
    return resp


@router.put("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: int,
    trip_update: TripUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot edit another user's trip")

    for field, val in trip_update.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(trip, field, val)

    if trip.end_date < trip.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date cannot be earlier than start date.")

    db.commit()
    db.refresh(trip)

    stats = _calculate_trip_stats(trip, db)
    resp = TripResponse.model_validate(trip)
    resp.duration_days = stats["duration_days"]
    resp.stops_count = stats["stops_count"]
    resp.estimated_total_cost = stats["estimated_total_cost"]
    return resp


@router.delete("/{trip_id}", status_code=status.HTTP_200_OK)
def delete_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete another user's trip")

    db.delete(trip)
    db.commit()
    return {"message": "Trip deleted successfully."}


@router.post("/{trip_id}/duplicate", response_model=TripResponse)
def duplicate_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    source_trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not source_trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    new_trip = Trip(
        user_id=current_user.id,
        title=f"{source_trip.title} (Copy)",
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

    # Clone stops
    stops = db.query(TripStop).filter(TripStop.trip_id == source_trip.id).all()
    stop_id_map = {}
    for s in stops:
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

    # Clone itinerary activities
    acts = db.query(ItineraryActivity).filter(ItineraryActivity.trip_id == source_trip.id).all()
    for a in acts:
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

    stats = _calculate_trip_stats(new_trip, db)
    resp = TripResponse.model_validate(new_trip)
    resp.duration_days = stats["duration_days"]
    resp.stops_count = stats["stops_count"]
    resp.estimated_total_cost = stats["estimated_total_cost"]
    return resp


# ================= Stops Management =================
@router.post("/{trip_id}/stops", response_model=TripStopResponse, status_code=status.HTTP_201_CREATED)
def add_trip_stop(
    trip_id: int,
    stop_in: TripStopCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    if stop_in.departure_date < stop_in.arrival_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Departure date cannot be before arrival date.")

    # Calculate default order index
    max_order = db.query(TripStop).filter(TripStop.trip_id == trip_id).count()
    order_idx = stop_in.order_index if stop_in.order_index is not None and stop_in.order_index > 0 else max_order

    stop = TripStop(
        trip_id=trip.id,
        city_id=stop_in.city_id,
        arrival_date=stop_in.arrival_date,
        departure_date=stop_in.departure_date,
        travel_mode=stop_in.travel_mode,
        travel_cost=stop_in.travel_cost,
        order_index=order_idx,
        notes=stop_in.notes or "",
    )
    db.add(stop)
    db.commit()
    db.refresh(stop)

    # Eager load city for response
    stop = db.query(TripStop).options(joinedload(TripStop.city)).filter(TripStop.id == stop.id).first()
    return stop


@router.put("/{trip_id}/stops/{stop_id}", response_model=TripStopResponse)
def update_trip_stop(
    trip_id: int,
    stop_id: int,
    stop_in: TripStopUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or (trip.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    stop = db.query(TripStop).filter(TripStop.id == stop_id, TripStop.trip_id == trip_id).first()
    if not stop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stop not found")

    for field, val in stop_in.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(stop, field, val)

    if stop.departure_date < stop.arrival_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Departure date cannot be before arrival date.")

    db.commit()
    db.refresh(stop)
    stop = db.query(TripStop).options(joinedload(TripStop.city)).filter(TripStop.id == stop.id).first()
    return stop


@router.delete("/{trip_id}/stops/{stop_id}", status_code=status.HTTP_200_OK)
def delete_trip_stop(
    trip_id: int,
    stop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or (trip.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    stop = db.query(TripStop).filter(TripStop.id == stop_id, TripStop.trip_id == trip_id).first()
    if not stop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stop not found")

    db.delete(stop)
    db.commit()
    return {"message": "Stop deleted successfully."}


@router.post("/{trip_id}/stops/reorder")
def reorder_stops(
    trip_id: int,
    payload: ReorderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or (trip.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    for item in payload.items:
        db.query(TripStop).filter(TripStop.id == item.id, TripStop.trip_id == trip_id).update({"order_index": item.order_index})

    db.commit()
    return {"message": "Stops reordered successfully."}


# ================= Activities Management =================
@router.post("/{trip_id}/activities", response_model=ItineraryActivityResponse, status_code=status.HTTP_201_CREATED)
def add_itinerary_activity(
    trip_id: int,
    act_in: ItineraryActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or (trip.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    if act_in.date < trip.start_date or act_in.date > trip.end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Activity date must be within trip duration.")

    cost = act_in.estimated_cost
    if act_in.activity_id and cost == 0.0:
        base_act = db.query(Activity).filter(Activity.id == act_in.activity_id).first()
        if base_act:
            cost = base_act.estimated_cost

    entry = ItineraryActivity(
        trip_id=trip.id,
        stop_id=act_in.stop_id,
        activity_id=act_in.activity_id,
        custom_activity_name=act_in.custom_activity_name,
        date=act_in.date,
        start_time=act_in.start_time,
        end_time=act_in.end_time,
        estimated_cost=cost,
        notes=act_in.notes or "",
        order_index=act_in.order_index or 0,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    entry = db.query(ItineraryActivity).options(joinedload(ItineraryActivity.activity)).filter(ItineraryActivity.id == entry.id).first()
    return entry


@router.put("/{trip_id}/activities/{act_id}", response_model=ItineraryActivityResponse)
def update_itinerary_activity(
    trip_id: int,
    act_id: int,
    act_in: ItineraryActivityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or (trip.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    entry = db.query(ItineraryActivity).filter(ItineraryActivity.id == act_id, ItineraryActivity.trip_id == trip_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity entry not found")

    for field, val in act_in.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(entry, field, val)

    db.commit()
    db.refresh(entry)
    entry = db.query(ItineraryActivity).options(joinedload(ItineraryActivity.activity)).filter(ItineraryActivity.id == entry.id).first()
    return entry


@router.delete("/{trip_id}/activities/{act_id}", status_code=status.HTTP_200_OK)
def delete_itinerary_activity(
    trip_id: int,
    act_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or (trip.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    entry = db.query(ItineraryActivity).filter(ItineraryActivity.id == act_id, ItineraryActivity.trip_id == trip_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity entry not found")

    db.delete(entry)
    db.commit()
    return {"message": "Activity removed from itinerary."}


@router.post("/{trip_id}/activities/reorder")
def reorder_activities(
    trip_id: int,
    payload: ReorderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or (trip.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    for item in payload.items:
        db.query(ItineraryActivity).filter(ItineraryActivity.id == item.id, ItineraryActivity.trip_id == trip_id).update({"order_index": item.order_index})

    db.commit()
    return {"message": "Activities reordered successfully."}


@router.get("/{trip_id}/conflicts", response_model=ConflictCheckResponse)
def get_trip_conflicts(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or (trip.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    acts = (
        db.query(ItineraryActivity)
        .options(joinedload(ItineraryActivity.activity))
        .filter(ItineraryActivity.trip_id == trip_id)
        .all()
    )
    act_dicts = []
    for a in acts:
        act_dicts.append(
            {
                "date": a.date,
                "start_time": a.start_time,
                "end_time": a.end_time,
                "name": a.activity.name if a.activity else a.custom_activity_name,
            }
        )

    return check_itinerary_conflicts(act_dicts)


# ================= Budget & Expenses =================
@router.get("/{trip_id}/budget", response_model=BudgetSummaryResponse)
def get_trip_budget_details(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.user_id != current_user.id and current_user.role != "admin" and not trip.is_public:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    return calculate_trip_budget(trip, db)


@router.post("/{trip_id}/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def add_trip_expense(
    trip_id: int,
    exp_in: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or (trip.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    expense = Expense(
        trip_id=trip.id,
        category=exp_in.category,
        description=exp_in.description,
        amount=exp_in.amount,
        date=exp_in.date,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{trip_id}/expenses/{exp_id}", status_code=status.HTTP_200_OK)
def delete_trip_expense(
    trip_id: int,
    exp_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or (trip.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    exp = db.query(Expense).filter(Expense.id == exp_id, Expense.trip_id == trip_id).first()
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    db.delete(exp)
    db.commit()
    return {"message": "Expense deleted."}


# ================= Public Sharing =================
@router.post("/{trip_id}/share")
def toggle_trip_share(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or (trip.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    if not trip.share_token:
        trip.share_token = secrets.token_urlsafe(16)
    trip.is_public = not trip.is_public

    db.commit()
    db.refresh(trip)

    return {
        "is_public": trip.is_public,
        "share_token": trip.share_token,
        "public_url": f"/shared-trip/{trip.share_token}",
    }
