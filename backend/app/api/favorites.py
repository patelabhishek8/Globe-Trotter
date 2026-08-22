from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.auth.deps import get_current_user, get_db
from backend.app.models.models import Activity, City, Favorite, Trip, User
from backend.app.schemas.schemas import FavoriteCreate, FavoriteResponse

router = APIRouter(prefix="/favorites", tags=["Favorites & Saved"])


@router.get("", response_model=List[FavoriteResponse])
def get_user_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favs = db.query(Favorite).filter(Favorite.user_id == current_user.id).order_by(Favorite.created_at.desc()).all()
    results = []
    for f in favs:
        item_details = None
        if f.item_type == "city":
            city = db.query(City).filter(City.id == f.item_id).first()
            if city:
                item_details = {
                    "id": city.id,
                    "name": city.name,
                    "state": city.state,
                    "region": city.region,
                    "image_url": city.image_url,
                    "cost_index": city.cost_index,
                    "popularity": city.popularity,
                    "description": city.description,
                }
        elif f.item_type == "activity":
            act = db.query(Activity).filter(Activity.id == f.item_id).first()
            if act:
                item_details = {
                    "id": act.id,
                    "name": act.name,
                    "category": act.category,
                    "duration_hours": act.duration_hours,
                    "estimated_cost": act.estimated_cost,
                    "rating": act.rating,
                    "image_url": act.image_url,
                    "description": act.description,
                }
        elif f.item_type == "trip":
            trip = db.query(Trip).filter(Trip.id == f.item_id).first()
            if trip:
                item_details = {
                    "id": trip.id,
                    "title": trip.title,
                    "start_date": str(trip.start_date),
                    "end_date": str(trip.end_date),
                    "overall_budget": trip.overall_budget,
                    "cover_image": trip.cover_image,
                    "share_token": trip.share_token,
                }

        resp = FavoriteResponse.model_validate(f)
        resp.item_details = item_details
        results.append(resp)

    return results


@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
def add_favorite(
    fav_in: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id,
            Favorite.item_type == fav_in.item_type,
            Favorite.item_id == fav_in.item_id,
        )
        .first()
    )
    if existing:
        return FavoriteResponse.model_validate(existing)

    fav = Favorite(
        user_id=current_user.id,
        item_type=fav_in.item_type,
        item_id=fav_in.item_id,
    )
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return FavoriteResponse.model_validate(fav)


@router.delete("/{fav_id}", status_code=status.HTTP_200_OK)
def remove_favorite(
    fav_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fav = db.query(Favorite).filter(Favorite.id == fav_id, Favorite.user_id == current_user.id).first()
    if not fav:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")

    db.delete(fav)
    db.commit()
    return {"message": "Favorite removed."}
