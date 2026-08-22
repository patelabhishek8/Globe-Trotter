import datetime
from typing import Dict, List
from sqlalchemy.orm import Session

from backend.app.models.models import Expense, ItineraryActivity, Trip, TripStop
from backend.app.schemas.schemas import BudgetSummaryResponse, CategoryCost, DailyCost

ACCOMMODATION_RATES = {
    "Budget": 1200.0,
    "Standard": 2500.0,
    "Premium": 5500.0,
    "Luxury": 12000.0,
}

FOOD_RATES = {
    "Budget": 600.0,
    "Standard": 1200.0,
    "Premium": 2200.0,
    "Luxury": 4500.0,
}

CATEGORY_COLORS = {
    "Transport": "#1769AA",       # Primary Brand Blue
    "Accommodation": "#0F9D8A",   # Secondary Teal
    "Activities": "#F59E0B",      # Warm Orange
    "Food": "#8B5CF6",            # Purple
    "Other": "#EC4899",           # Pink
}


def calculate_trip_budget(trip: Trip, db: Session) -> BudgetSummaryResponse:
    duration_days = max(1, (trip.end_date - trip.start_date).days + 1)
    travel_style = trip.travel_style or "Standard"

    daily_accom_rate = ACCOMMODATION_RATES.get(travel_style, 2500.0)
    daily_food_rate = FOOD_RATES.get(travel_style, 1200.0)

    # 1. Transport costs (Stops travel costs + custom transport expenses)
    stops = db.query(TripStop).filter(TripStop.trip_id == trip.id).all()
    stops_transport = sum(s.travel_cost or 0.0 for s in stops)

    # 2. Activity costs (Itinerary activities + custom activity expenses)
    itinerary_acts = db.query(ItineraryActivity).filter(ItineraryActivity.trip_id == trip.id).all()
    activities_cost = sum(
        ia.estimated_cost if (ia.estimated_cost and ia.estimated_cost > 0)
        else (ia.activity.estimated_cost if (ia.activity and ia.activity.estimated_cost) else 0.0)
        for ia in itinerary_acts
    )

    # 3. Custom expenses recorded
    expenses = db.query(Expense).filter(Expense.trip_id == trip.id).all()
    expense_totals = {
        "Transport": 0.0,
        "Accommodation": 0.0,
        "Activities": 0.0,
        "Food": 0.0,
        "Other": 0.0,
    }
    for exp in expenses:
        cat = exp.category.capitalize() if exp.category else "Other"
        if cat not in expense_totals:
            cat = "Other"
        expense_totals[cat] += exp.amount

    # Total Category Computations
    total_transport = stops_transport + expense_totals["Transport"]
    total_accommodation = (daily_accom_rate * duration_days) + expense_totals["Accommodation"]
    total_activities = activities_cost + expense_totals["Activities"]
    total_food = (daily_food_rate * duration_days) + expense_totals["Food"]
    total_other = expense_totals["Other"]

    estimated_total = total_transport + total_accommodation + total_activities + total_food + total_other
    overall_budget = trip.overall_budget or 30000.0
    remaining_budget = overall_budget - estimated_total
    is_overbudget = estimated_total > overall_budget
    overbudget_amount = max(0.0, estimated_total - overall_budget)

    # Determine largest category for alert attribution
    cat_map = {
        "Transport": total_transport,
        "Accommodation": total_accommodation,
        "Activities": total_activities,
        "Food": total_food,
        "Other": total_other,
    }
    largest_category = max(cat_map, key=cat_map.get) if estimated_total > 0 else "Accommodation"
    overbudget_category = largest_category if is_overbudget else None

    # Percentages and Category Costs
    breakdown_by_category: List[CategoryCost] = []
    for cat_name, amount in cat_map.items():
        pct = (amount / estimated_total * 100.0) if estimated_total > 0 else 0.0
        breakdown_by_category.append(
            CategoryCost(
                category=cat_name,
                amount=round(amount, 2),
                percentage=round(pct, 1),
                color=CATEGORY_COLORS.get(cat_name, "#667085"),
            )
        )

    # Build Day-by-Day Breakdown for Bar Chart
    daily_breakdown: List[DailyCost] = []
    current_date = trip.start_date
    for day_idx in range(1, duration_days + 1):
        # find city for this day
        city_name = "Transit / Destination"
        for s in stops:
            if s.arrival_date <= current_date <= s.departure_date:
                city_name = s.city.name if s.city else "City Stop"
                break

        # day activities
        day_acts_cost = sum(
            ia.estimated_cost if (ia.estimated_cost and ia.estimated_cost > 0)
            else (ia.activity.estimated_cost if (ia.activity and ia.activity.estimated_cost) else 0.0)
            for ia in itinerary_acts if ia.date == current_date
        )

        # day expenses
        day_expenses = [e for e in expenses if e.date == current_date]
        day_other = sum(e.amount for e in day_expenses if e.category not in ["Transport", "Accommodation", "Activities", "Food"])
        day_extra_transport = sum(e.amount for e in day_expenses if e.category == "Transport")
        day_extra_accom = sum(e.amount for e in day_expenses if e.category == "Accommodation")
        day_extra_food = sum(e.amount for e in day_expenses if e.category == "Food")

        day_transport = (stops_transport / duration_days) + day_extra_transport
        day_accom = daily_accom_rate + day_extra_accom
        day_food = daily_food_rate + day_extra_food
        day_activities = day_acts_cost + sum(e.amount for e in day_expenses if e.category == "Activities")
        day_total = day_transport + day_accom + day_food + day_activities + day_other

        daily_breakdown.append(
            DailyCost(
                day_number=day_idx,
                date=current_date.strftime("%b %d"),
                city_name=city_name,
                transport_cost=round(day_transport, 2),
                accommodation_cost=round(day_accom, 2),
                activity_cost=round(day_activities, 2),
                food_cost=round(day_food, 2),
                other_cost=round(day_other, 2),
                total_cost=round(day_total, 2),
            )
        )
        current_date += datetime.timedelta(days=1)

    average_daily_cost = round(estimated_total / duration_days, 2)

    return BudgetSummaryResponse(
        overall_budget=round(overall_budget, 2),
        estimated_total=round(estimated_total, 2),
        remaining_budget=round(remaining_budget, 2),
        is_overbudget=is_overbudget,
        overbudget_amount=round(overbudget_amount, 2),
        overbudget_category=overbudget_category,
        average_daily_cost=average_daily_cost,
        duration_days=duration_days,
        breakdown_by_category=breakdown_by_category,
        daily_breakdown=daily_breakdown,
        formula_note="Estimated Total = Transport + Accommodation + Activities + Food + Other Expenses",
    )
