from typing import List
from sqlalchemy.orm import Session

from backend.app.models.models import Activity, City, User
from backend.app.schemas.schemas import CityRecommendation, CityResponse, RecommendationResponse


def get_smart_recommendations(user: User, db: Session) -> RecommendationResponse:
    user_interests = [i.strip() for i in (user.interests or "History,Culture,Food").split(",") if i.strip()]
    user_style = user.travel_style or "Standard"
    user_budget = user.budget_preference or "Moderate"

    all_cities = db.query(City).all()
    city_recommendations: List[CityRecommendation] = []

    for city in all_cities:
        city_interests = [ci.strip() for ci in (city.best_suited_interests or "").split(",") if ci.strip()]
        matched_interests = [i for i in user_interests if i in city_interests]

        score = city.popularity or 80

        reasons = []
        if matched_interests:
            score += len(matched_interests) * 15
            reasons.append(f"Recommended because you selected {' + '.join(matched_interests)}")

        if city.cost_index == user_budget:
            score += 10
            reasons.append(f"Matches your {user_budget} budget preference")

        if not reasons:
            reasons.append(f"Top-rated destination in {city.region} India ({city.popularity}% traveler approval)")

        reason_text = " • ".join(reasons)

        city_recommendations.append(
            CityRecommendation(
                city=CityResponse.model_validate(city),
                match_score=min(99, score),
                reason=reason_text,
            )
        )

    # Sort descending by match score
    city_recommendations.sort(key=lambda x: x.match_score, reverse=True)

    # Activity recommendations based on user interests
    recommended_activities = []
    if user_interests:
        act_query = db.query(Activity).filter(Activity.category.in_(user_interests)).order_by(Activity.rating.desc(), Activity.popularity_score.desc()).limit(8).all()
        recommended_activities = act_query

    return RecommendationResponse(
        user_interests=user_interests,
        user_style=user_style,
        recommended_cities=city_recommendations[:9],
        recommended_activities=recommended_activities,
    )
