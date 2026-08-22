from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.auth.deps import get_current_user, get_db
from backend.app.models.models import User
from backend.app.schemas.schemas import RecommendationResponse
from backend.app.services.recommendation_service import get_smart_recommendations

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("", response_model=RecommendationResponse)
def get_user_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_smart_recommendations(current_user, db)
