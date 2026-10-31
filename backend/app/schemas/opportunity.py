from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date

class OpportunityDateBase(BaseModel):
    date_type: str  # start_date, deadline, exam_date, admit_card, result_date, counselling
    date_value: date
    verification_status: str = "verified"

class OpportunityDateResponse(OpportunityDateBase):
    id: str
    opportunity_id: str
    source_id: Optional[str] = None
    created_at: Optional[datetime] = None

class OpportunityBase(BaseModel):
    title: str
    organization: Optional[str] = None
    opportunity_type: str = "other"  # railway, govt, scholarship, admission, exam, internship, private_job, other
    official_url: Optional[str] = None
    application_start_date: Optional[date] = None
    application_deadline: Optional[date] = None
    application_status: str = "Not Started"  # Not Started, In Progress, Registered, Completed, Not Interested
    monitoring_enabled: bool = True
    research_project_id: Optional[str] = None

class OpportunityCreate(OpportunityBase):
    dates: Optional[List[OpportunityDateBase]] = []

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    organization: Optional[str] = None
    opportunity_type: Optional[str] = None
    official_url: Optional[str] = None
    application_start_date: Optional[date] = None
    application_deadline: Optional[date] = None
    application_status: Optional[str] = None
    monitoring_enabled: Optional[bool] = None

class OpportunityStatusUpdate(BaseModel):
    application_status: str

class OpportunityResponse(OpportunityBase):
    id: str
    user_id: str
    dates: List[OpportunityDateResponse] = []
    days_remaining: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

