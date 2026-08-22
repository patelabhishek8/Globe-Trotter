import datetime
from typing import List, Tuple
from backend.app.schemas.schemas import ConflictCheckResponse, ConflictWarning


def time_to_minutes(time_str: str) -> int:
    """Converts 'HH:MM' string to minutes since midnight."""
    try:
        parts = time_str.strip().split(":")
        hours = int(parts[0])
        minutes = int(parts[1]) if len(parts) > 1 else 0
        return hours * 60 + minutes
    except Exception:
        return 0


def format_minutes_to_time(minutes: int) -> str:
    """Converts minutes since midnight to 12-hour format e.g. 2:00 PM."""
    hours = (minutes // 60) % 24
    mins = minutes % 60
    period = "AM" if hours < 12 else "PM"
    display_hour = hours % 12
    if display_hour == 0:
        display_hour = 12
    return f"{display_hour}:{mins:02d} {period}"


def check_itinerary_conflicts(itinerary_activities: List[dict]) -> ConflictCheckResponse:
    """
    Checks for overlapping activities within the same calendar date.
    Each item in itinerary_activities must contain 'date', 'start_time', 'end_time', and name.
    """
    # Group activities by date
    by_date: dict[str, List[dict]] = {}
    for act in itinerary_activities:
        date_str = str(act.get("date"))
        if date_str not in by_date:
            by_date[date_str] = []
        by_date[date_str].append(act)

    conflicts: List[ConflictWarning] = []

    for date_str, acts in by_date.items():
        n = len(acts)
        for i in range(n):
            for j in range(i + 1, n):
                a1 = acts[i]
                a2 = acts[j]

                s1 = time_to_minutes(a1.get("start_time", "09:00"))
                e1 = time_to_minutes(a1.get("end_time", "11:00"))
                s2 = time_to_minutes(a2.get("start_time", "10:00"))
                e2 = time_to_minutes(a2.get("end_time", "12:00"))

                # Check if ranges overlap: start1 < end2 and start2 < end1
                if s1 < e2 and s2 < e1:
                    overlap_start = max(s1, s2)
                    overlap_end = min(e1, e2)
                    t_start = format_minutes_to_time(overlap_start)
                    t_end = format_minutes_to_time(overlap_end)

                    name1 = a1.get("name") or a1.get("custom_activity_name") or "Activity 1"
                    name2 = a2.get("name") or a2.get("custom_activity_name") or "Activity 2"

                    msg = f"These activities ('{name1}' and '{name2}') overlap from {t_start} to {t_end} on {date_str}."

                    conflicts.append(
                        ConflictWarning(
                            date=date_str,
                            activity1_name=name1,
                            activity1_time=f"{a1.get('start_time')} - {a1.get('end_time')}",
                            activity2_name=name2,
                            activity2_time=f"{a2.get('start_time')} - {a2.get('end_time')}",
                            message=msg,
                        )
                    )

    return ConflictCheckResponse(has_conflicts=len(conflicts) > 0, conflicts=conflicts)
