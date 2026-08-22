from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.auth.deps import get_db
from backend.app.models.models import Activity, City
from backend.app.schemas.schemas import ActivityResponse

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.get("", response_model=List[ActivityResponse])
def get_activities(
    search: Optional[str] = Query(None, description="Search by activity name or description"),
    city_id: Optional[int] = Query(None, description="Filter by city ID"),
    category: Optional[str] = Query(None, description="Sightseeing, Food, Culture, Adventure, Shopping, Nature, Entertainment, Photography"),
    max_cost: Optional[float] = Query(None, description="Maximum estimated cost"),
    sort_by: Optional[str] = Query("popularity", description="popularity, cost, rating, duration"),
    order: Optional[str] = Query("desc", description="asc or desc"),
    db: Session = Depends(get_db),
):
    query = db.query(Activity)

    if city_id:
        query = query.filter(Activity.city_id == city_id)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Activity.name.ilike(search_pattern))
            | (Activity.description.ilike(search_pattern))
            | (Activity.category.ilike(search_pattern))
        )

    if category and category.lower() != "all":
        query = query.filter(Activity.category.ilike(category.strip()))

    if max_cost is not None:
        query = query.filter(Activity.estimated_cost <= max_cost)

    if sort_by == "cost":
        query = query.order_by(Activity.estimated_cost.asc() if order == "asc" else Activity.estimated_cost.desc())
    elif sort_by == "rating":
        query = query.order_by(Activity.rating.desc() if order == "desc" else Activity.rating.asc())
    elif sort_by == "duration":
        query = query.order_by(Activity.duration_hours.asc() if order == "asc" else Activity.duration_hours.desc())
    else:  # popularity
        query = query.order_by(Activity.popularity_score.desc() if order == "desc" else Activity.popularity_score.asc())

    return query.all()


@router.get("/{activity_id}", response_model=ActivityResponse)
def get_activity_details(activity_id: int, db: Session = Depends(get_db)):
    act = db.query(Activity).filter(Activity.id == activity_id).first()
    if not act:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )
    return act
