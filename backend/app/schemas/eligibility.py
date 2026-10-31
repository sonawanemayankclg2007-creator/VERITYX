from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import date, datetime

class CriterionRequirement(BaseModel):
    id: str
    criterion_type: str  # age, education, physical, medical, income, experience, skill, document, domicile, category
    label: str
    official_requirement: str
    is_mandatory: bool = True
    input_type: str  # text, number, select, boolean, date
    options: Optional[List[str]] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    unit: Optional[str] = None
    help_text: Optional[str] = None

class OpportunityCriteria(BaseModel):
    opportunity_id: Optional[str] = None
    title: str
    organization: Optional[str] = None
    category: str  # railway, defence, scholarship, govt_job, college_admission, internship, private_job, exam, other
    official_notification_url: Optional[str] = None
    application_deadline: Optional[str] = None
    criteria_list: List[CriterionRequirement]
    required_documents: List[str] = []
    medical_disclaimer: Optional[str] = None

class CandidateCriterionInput(BaseModel):
    criterion_id: str
    value: Any
    certificate_uploaded: Optional[bool] = False

class CandidateProfileInput(BaseModel):
    opportunity_id: Optional[str] = None
    opportunity_title: str
    category: str
    user_category: Optional[str] = "Student"  # Student, Employee, Unemployed
    age: Optional[int] = None
    birth_date: Optional[str] = None
    social_category: Optional[str] = "General"  # General, OBC, SC, ST, EWS
    education_level: Optional[str] = None
    education_percentage: Optional[float] = None
    technical_qualifications: Optional[List[str]] = []
    family_annual_income: Optional[float] = None
    state_of_domicile: Optional[str] = None
    # Physical/Medical (only for defence/railway/police where applicable)
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    chest_cm_normal: Optional[float] = None
    chest_cm_expanded: Optional[float] = None
    vision_standard: Optional[str] = None  # 6/6, 6/9, 6/12, etc.
    # Professional (jobs/internships)
    years_experience: Optional[float] = None
    skills: Optional[List[str]] = []
    portfolio_url: Optional[str] = None
    # Criteria responses
    criteria_responses: Dict[str, Any] = {}
    available_documents: List[str] = []

class CriterionEvaluationResult(BaseModel):
    criterion_id: str
    label: str
    official_requirement: str
    user_input: str
    status: str  # Satisfied, Failed, Conditionally Eligible, Missing Information, Verification Required
    explanation: str

class ReadinessBreakdown(BaseModel):
    qualifications_score: int
    certificates_score: int
    skills_score: int
    preparation_progress_score: int
    profile_completeness_score: int

class EligibilityAssessmentReport(BaseModel):
    id: str
    user_id: str
    opportunity_id: Optional[str] = None
    opportunity_title: str
    category: str
    overall_status: str  # Eligible, Not Eligible, Conditionally Eligible, Insufficient Information, Verification Required
    readiness_score: int  # 0 to 100
    readiness_explanation: str
    readiness_breakdown: ReadinessBreakdown
    criteria_evaluations: List[CriterionEvaluationResult]
    strengths: List[str]
    missing_requirements: List[str]
    required_certificates: List[str]
    weaknesses_and_gaps: List[str]
    recommendations: List[str]
    next_steps: List[str]
    verification_warnings: List[str]
    assessed_at: str

class AIAssistantMessage(BaseModel):
    role: str  # user, assistant
    content: str

class AIAssistantRequest(BaseModel):
    message: str
    context_opportunity_id: Optional[str] = None
    conversation_history: List[AIAssistantMessage] = []

class AIAssistantResponse(BaseModel):
    reply: str
    suggested_actions: List[str] = []
    related_opportunity_id: Optional[str] = None

class FollowUpResponse(BaseModel):
    opportunity_id: str
    response_type: str  # completed, still_in_progress, need_help
    progress_notes: Optional[str] = None

