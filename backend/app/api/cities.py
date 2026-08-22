from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.auth.deps import get_db
from backend.app.models.models import Activity, City
from backend.app.schemas.schemas import ActivityResponse, CityResponse, CityWithActivities

router = APIRouter(prefix="/cities", tags=["Cities"])


@router.get("", response_model=List[CityResponse])
def get_cities(
    search: Optional[str] = Query(None, description="Search by city name or state"),
    region: Optional[str] = Query(None, description="Filter by region (North, South, West, East, Central)"),
    cost_index: Optional[str] = Query(None, description="Filter by cost index (Budget, Moderate, Luxury)"),
    sort_by: Optional[str] = Query("popularity", description="Sort by popularity, cost, or name"),
    order: Optional[str] = Query("desc", description="asc or desc"),
    db: Session = Depends(get_db),
):
    query = db.query(City)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (City.name.ilike(search_pattern))
            | (City.state.ilike(search_pattern))
            | (City.description.ilike(search_pattern))
            | (City.best_suited_interests.ilike(search_pattern))
        )

    if region and region.lower() != "all":
        query = query.filter(City.region.ilike(region.strip()))

    if cost_index and cost_index.lower() != "all":
        query = query.filter(City.cost_index.ilike(cost_index.strip()))

    if sort_by == "name":
        query = query.order_by(City.name.asc() if order == "asc" else City.name.desc())
    elif sort_by == "cost":
        query = query.order_by(City.cost_index.asc() if order == "asc" else City.cost_index.desc())
    else:  # popularity
        query = query.order_by(City.popularity.desc() if order == "desc" else City.popularity.asc())

    return query.all()


@router.get("/{city_id}", response_model=CityWithActivities)
def get_city_details(city_id: int, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="City not found",
        )
    return city


@router.get("/{city_id}/activities", response_model=List[ActivityResponse])
def get_city_activities(city_id: int, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="City not found",
        )
    return db.query(Activity).filter(Activity.city_id == city_id).order_by(Activity.popularity_score.desc()).all()
