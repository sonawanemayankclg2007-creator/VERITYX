from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class MonitoringCheckRequest(BaseModel):
    opportunity_id: Optional[str] = None
    source_id: Optional[str] = None

class SourceChangeResponse(BaseModel):
    id: str
    source_id: str
    opportunity_id: Optional[str] = None
    change_type: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    change_summary: str
    verification_status: str
    detected_at: Optional[datetime] = None

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    opportunity_id: Optional[str] = None
    notification_type: str
    title: str
    message: str
    read_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

class NotificationPreferenceUpdate(BaseModel):
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    in_app_enabled: Optional[bool] = None
    reminder_intervals: Optional[List[int]] = None

