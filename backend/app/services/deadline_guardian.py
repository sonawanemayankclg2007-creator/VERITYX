"""
VERITYX AI 2.0 - Smart Deadline Guardian & Opportunity Health Monitor
Monitors application deadlines in Asia/Kolkata timezone, triggers scheduled alerts
(5d, 3d, 1d, 0d, overdue), health status evaluation, and 4-day progress follow-ups.
"""

from datetime import datetime, timezone, timedelta, date
from typing import Dict, Any, Optional, List, Tuple
import uuid

# Asia/Kolkata Timezone (IST: UTC+5:30)
try:
    import zoneinfo
    IST_TZ = zoneinfo.ZoneInfo("Asia/Kolkata")
except Exception:
    IST_TZ = timezone(timedelta(hours=5, minutes=30))

class DeadlineGuardian:
    @staticmethod
    def now_ist() -> datetime:
        return datetime.now(IST_TZ)

    @staticmethod
    def parse_deadline(deadline_input: Any) -> Optional[datetime]:
        if not deadline_input:
            return None
        if isinstance(deadline_input, datetime):
            return deadline_input.astimezone(IST_TZ) if deadline_input.tzinfo else deadline_input.replace(tzinfo=IST_TZ)
        if isinstance(deadline_input, date):
            return datetime.combine(deadline_input, datetime.min.time(), tzinfo=IST_TZ)
        
        # String parse
        str_val = str(deadline_input).strip()
        # Handle ISO strings or YYYY-MM-DD
        try:
            date_part = str_val.split("T")[0]
            dt = datetime.strptime(date_part, "%Y-%m-%d")
            return dt.replace(tzinfo=IST_TZ)
        except Exception:
            return None

    @classmethod
    def calculate_deadline_metrics(cls, deadline_input: Any) -> Dict[str, Any]:
        deadline_dt = cls.parse_deadline(deadline_input)
        if not deadline_dt:
            return {
                "has_deadline": False,
                "days_remaining": None,
                "hours_remaining": None,
                "is_overdue": False,
                "urgency_level": "none",
                "formatted_ist": "No Deadline Specified"
            }

        now = cls.now_ist()
        # Set deadline to end of day (23:59:59) if only date provided
        end_of_deadline_day = deadline_dt.replace(hour=23, minute=59, second=59)
        time_diff = end_of_deadline_day - now

        total_seconds = int(time_diff.total_seconds())
        days_remaining = (deadline_dt.date() - now.date()).days
        hours_remaining = max(0, total_seconds // 3600)
        is_overdue = total_seconds < 0

        if is_overdue:
            urgency = "overdue"
        elif days_remaining <= 0:
            urgency = "final_day"
        elif days_remaining <= 1:
            urgency = "critical"
        elif days_remaining <= 3:
            urgency = "high"
        elif days_remaining <= 5:
            urgency = "medium"
        else:
            urgency = "normal"

        return {
            "has_deadline": True,
            "days_remaining": days_remaining,
            "hours_remaining": hours_remaining,
            "is_overdue": is_overdue,
            "urgency_level": urgency,
            "formatted_ist": deadline_dt.strftime("%d %b %Y") + " (IST)"
        }

    @classmethod
    def evaluate_health_status(cls, opp: Dict[str, Any]) -> str:
        """
        Determines Opportunity Health:
        - Completed: Status is Completed or Registered
        - Overdue: Deadline passed and status is not Completed/Registered
        - At Risk: <= 3 days remaining and status is Not Started or In Progress
        - On Track: > 3 days remaining
        """
        app_status = (opp.get("application_status") or "Not Started").strip().lower()
        if app_status in ("completed", "registered"):
            return "Completed"

        metrics = cls.calculate_deadline_metrics(opp.get("application_deadline"))
        if not metrics["has_deadline"]:
            return "On Track"

        if metrics["is_overdue"]:
            return "Overdue"

        days = metrics["days_remaining"]
        if days is not None and days <= 3:
            return "At Risk"

        return "On Track"

    @classmethod
    def check_four_day_follow_up_needed(cls, opp: Dict[str, Any]) -> Tuple[bool, int]:
        """
        If opportunity is 'In Progress', check if 4 days have elapsed
        since creation or last follow-up response, or if scheduled 3-day follow-up is due.
        """
        status = (opp.get("application_status") or "").strip().lower()
        if status != "in progress":
            return False, 0

        now = cls.now_ist()

        # Check if next_followup_at was scheduled (e.g. 3-day follow-up after 'still_in_progress')
        next_followup = opp.get("next_followup_at")
        if next_followup:
            try:
                date_part = str(next_followup).split("T")[0]
                next_dt = datetime.strptime(date_part, "%Y-%m-%d").date()
                if now.date() >= next_dt:
                    days_over = (now.date() - next_dt).days
                    return True, 3 + days_over
                return False, 0
            except Exception:
                pass

        last_check = opp.get("last_followup_at") or opp.get("created_at")
        if not last_check:
            return False, 0

        try:
            date_part = str(last_check).split("T")[0]
            last_dt = datetime.strptime(date_part, "%Y-%m-%d").date()
            days_elapsed = (now.date() - last_dt).days
            return (days_elapsed >= 4, days_elapsed)
        except Exception:
            return False, 0

    @classmethod
    def generate_scheduled_notifications(
        cls,
        user_id: str,
        opp: Dict[str, Any],
        existing_notifications: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Evaluates 5-day, 3-day, 1-day, 0-day, and overdue thresholds.
        Generates notifications if not previously delivered for this opportunity.
        """
        metrics = cls.calculate_deadline_metrics(opp.get("application_deadline"))
        if not metrics["has_deadline"]:
            return []

        days = metrics["days_remaining"]
        is_overdue = metrics["is_overdue"]
        opp_id = opp["id"]
        opp_title = opp.get("title", "Tracked Opportunity")

        generated: List[Dict[str, Any]] = []

        def has_notif(tag: str) -> bool:
            return any(
                n.get("opportunity_id") == opp_id and tag in n.get("title", "")
                for n in existing_notifications
            )

        # 5-day reminder
        if days is not None and days == 5 and not has_notif("5 Days Remaining"):
            generated.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "opportunity_id": opp_id,
                "notification_type": "deadline_reminder",
                "title": f"5 Days Remaining: {opp_title}",
                "message": f"Smart Guardian Alert: Exactly 5 days remaining before applications close on {metrics['formatted_ist']}.",
                "priority": "medium",
                "created_at": cls.now_ist().isoformat()
            })

        # 3-day reminder
        if days is not None and days == 3 and not has_notif("3 Days Remaining"):
            generated.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "opportunity_id": opp_id,
                "notification_type": "deadline_reminder",
                "title": f"3 Days Remaining: {opp_title}",
                "message": f"High Priority: Only 3 days left until the cutoff. Ensure your documents and application fees are ready.",
                "priority": "high",
                "created_at": cls.now_ist().isoformat()
            })

        # 1-day reminder
        if days is not None and days == 1 and not has_notif("1 Day Remaining"):
            generated.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "opportunity_id": opp_id,
                "notification_type": "deadline_reminder",
                "title": f"1 Day Remaining: {opp_title}",
                "message": f"Urgent: Final 24 hours. The portal closes tomorrow ({metrics['formatted_ist']}). Submit early to avoid portal crashes.",
                "priority": "critical",
                "created_at": cls.now_ist().isoformat()
            })

        # 0-day (Final Day)
        if days is not None and days == 0 and not has_notif("Final Hours"):
            generated.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "opportunity_id": opp_id,
                "notification_type": "deadline_reminder",
                "title": f"Final Hours Today: {opp_title}",
                "message": f"Critical Cutoff: Today is the final submission date. Verify your final submission receipt immediately.",
                "priority": "critical",
                "created_at": cls.now_ist().isoformat()
            })

        # Overdue
        app_status = (opp.get("application_status") or "").lower()
        if is_overdue and app_status not in ("completed", "registered") and not has_notif("Deadline Passed"):
            generated.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "opportunity_id": opp_id,
                "notification_type": "deadline_reminder",
                "title": f"Deadline Passed: {opp_title}",
                "message": f"The application cutoff ({metrics['formatted_ist']}) has elapsed. This opportunity is now marked Overdue.",
                "priority": "high",
                "created_at": cls.now_ist().isoformat()
            })

        return generated

deadline_guardian = DeadlineGuardian()

