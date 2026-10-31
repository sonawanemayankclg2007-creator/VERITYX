from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime

class PDFGenerateRequest(BaseModel):
    research_project_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    title: Optional[str] = None

class PDFVersionResponse(BaseModel):
    id: str
    pdf_document_id: str
    version_number: int
    storage_path: str
    download_url: Optional[str] = None
    change_summary: Optional[str] = None
    source_snapshot: Optional[Dict[str, Any]] = None
    research_snapshot: Optional[Dict[str, Any]] = None
    generated_at: Optional[datetime] = None

class PDFDocumentResponse(BaseModel):
    id: str
    user_id: str
    research_project_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    title: str
    current_version: int
    versions: List[PDFVersionResponse] = []
    latest_download_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

