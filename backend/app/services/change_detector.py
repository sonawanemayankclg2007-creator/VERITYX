import hashlib
import re
from datetime import datetime
from typing import Dict, Any, Optional, List
from app.services.supabase_client import supabase_service

class ChangeDetector:
    """
    Monitors tracked opportunities and sources for meaningful changes.
    Detects deadline extensions, eligibility updates, and creates
    auditable change logs and notifications.
    """
    @staticmethod
    async def inspect_and_diff(
        source_id: str,
        opportunity_id: Optional[str],
        user_id: str,
        new_content: str,
        old_content: Optional[str],
        auth_token: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        new_hash = hashlib.sha256(new_content.encode("utf-8")).hexdigest()
        old_hash = hashlib.sha256(old_content.encode("utf-8")).hexdigest() if old_content else ""

        if new_hash == old_hash:
            return None  # No change

        # Detect deadline changes
        date_pattern = r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})'
        new_dates = re.findall(date_pattern, new_content, re.IGNORECASE)
        old_dates = re.findall(date_pattern, old_content or "", re.IGNORECASE)

        change_type = "content_update"
        summary = "Official source document text was modified."
        prev_val = None
        new_val = None

        if new_dates and old_dates and new_dates[-1] != old_dates[-1]:
            change_type = "deadline_extension"
            prev_val = old_dates[-1]
            new_val = new_dates[-1]
            summary = f"Possible date modification detected from {prev_val} to {new_val}."
        elif "extended" in new_content.lower() and "extended" not in (old_content or "").lower():
            change_type = "deadline_extension"
            summary = "Deadline extension notice detected in the updated official page."
        elif "eligibility" in new_content.lower() and (old_content and "eligibility" in old_content.lower()):
            change_type = "eligibility_change"
            summary = "Eligibility criteria clauses were updated."

        change_record = {
            "source_id": source_id,
            "opportunity_id": opportunity_id,
            "change_type": change_type,
            "previous_value": str(prev_val) if prev_val else None,
            "new_value": str(new_val) if new_val else None,
            "change_summary": summary,
            "verification_status": "Potential Change — Verification Required"
        }

        # Store in database
        saved_change = await supabase_service.insert("source_changes", change_record, auth_token)

        # Trigger notification for user
        notif = {
            "user_id": user_id,
            "opportunity_id": opportunity_id,
            "notification_type": "source_change",
            "title": f"Source Change Detected: {summary[:50]}...",
            "message": f"A potential update was identified: '{summary}'. Review the updated source snapshot before taking action.",
        }
        await supabase_service.insert("notifications", notif, auth_token)

        return saved_change or change_record

change_detector = ChangeDetector()

