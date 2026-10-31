from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime, date

class ClaimBase(BaseModel):
    claim_text: str
    claim_type: str = "factual"  # factual, requirement, deadline, eligibility, fee, policy
    confidence: float = 0.85
    evidence_text: Optional[str] = None
    source_id: Optional[str] = None

class ClaimCreate(ClaimBase):
    research_project_id: str

class ClaimResponse(ClaimBase):
    id: str
    research_project_id: str
    created_at: Optional[datetime] = None

class InformationGapBase(BaseModel):
    title: str
    description: str
    importance: str = "high"  # critical, high, medium, low
    confidence: float = 0.85
    status: str = "open"      # open, verifying, resolved, dismissed
    recommended_action: Optional[str] = None
    related_source_ids: List[str] = []

class InformationGapCreate(InformationGapBase):
    research_project_id: str

class InformationGapResponse(InformationGapBase):
    id: str
    research_project_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ConflictBase(BaseModel):
    description: str
    confidence: float = 0.85
    status: str = "unresolved"  # unresolved, resolved, disputed, false_positive
    recommended_action: Optional[str] = None
    claim_a_id: Optional[str] = None
    claim_b_id: Optional[str] = None

class ConflictCreate(ConflictBase):
    research_project_id: str

class ConflictResponse(ConflictBase):
    id: str
    research_project_id: str
    claim_a: Optional[ClaimResponse] = None
    claim_b: Optional[ClaimResponse] = None
    created_at: Optional[datetime] = None

class VerificationTaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # critical, high, medium, low
    status: str = "pending"   # pending, in_progress, completed, deferred
    due_date: Optional[date] = None
    information_gap_id: Optional[str] = None

class VerificationTaskCreate(VerificationTaskBase):
    research_project_id: str

class VerificationTaskResponse(VerificationTaskBase):
    id: str
    research_project_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ReadinessScore(BaseModel):
    score: int = Field(ge=0, le=100)
    explanation: str
    coverage_score: int = Field(ge=0, le=100)
    evidence_quality_score: int = Field(ge=0, le=100)
    unresolved_conflicts: int = 0
    freshness_score: int = Field(ge=0, le=100)
    critical_missing_information: Optional[str] = None

class OutdatedInfoItem(BaseModel):
    source_title: str
    observed_claim: str
    reason: str
    estimated_period: Optional[str] = None

class ResearchAnalysis(BaseModel):
    summary: str
    key_findings: List[str] = []
    claims: List[ClaimBase] = []
    information_gaps: List[InformationGapBase] = []
    conflicts: List[ConflictBase] = []
    outdated_information: List[OutdatedInfoItem] = []
    unanswered_questions: List[str] = []
    verification_checklist: List[VerificationTaskBase] = []
    readiness_score: ReadinessScore
    uncertainty_notes: List[str] = []

class SourceInput(BaseModel):
    url: Optional[str] = None
    title: str
    source_type: str = "webpage"  # webpage, pdf, announcement, manual
    source_content: Optional[str] = None
    publication_date: Optional[date] = None

class SourceResponse(BaseModel):
    id: str
    research_project_id: str
    user_id: str
    url: Optional[str] = None
    title: str
    source_type: str
    source_content: Optional[str] = None
    content_hash: Optional[str] = None
    publication_date: Optional[date] = None
    last_checked_at: Optional[datetime] = None
    freshness_status: str
    verification_status: str
    created_at: Optional[datetime] = None

class ResearchProjectCreate(BaseModel):
    title: str
    research_question: Optional[str] = None
    research_goal: Optional[str] = None
    sources: Optional[List[SourceInput]] = []

class ResearchProjectResponse(BaseModel):
    id: str
    user_id: str
    title: str
    research_question: Optional[str] = None
    research_goal: Optional[str] = None
    summary: Optional[str] = None
    readiness_score: Optional[Dict[str, Any]] = None
    status: str
    sources_count: Optional[int] = 0
    gaps_count: Optional[int] = 0
    conflicts_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

