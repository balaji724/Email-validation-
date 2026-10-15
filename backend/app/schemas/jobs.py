from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.app.schemas.email_validation import SingleValidationResponse

class FilePreviewResponse(BaseModel):
    filename: str
    file_type: str
    sheets: List[str]
    active_sheet: str
    headers: List[str]
    preview_rows: List[Dict[str, Any]]
    total_rows_estimated: int
    detected_email_column: Optional[str] = None

class JobSummaryResponse(BaseModel):
    id: str
    original_filename: str
    file_type: str
    sheet_name: Optional[str] = None
    email_column: str
    total_rows: int
    processed_rows: int
    valid_count: int
    invalid_count: int
    risky_count: int
    unknown_count: int
    status: str
    progress_percent: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

class JobRowItem(BaseModel):
    row_number: int
    original_data: Dict[str, Any]
    validation: SingleValidationResponse

class PaginatedResultsResponse(BaseModel):
    job_id: str
    page: int
    page_size: int
    total_rows: int
    processed_rows: int
    total_filtered: int
    total_pages: int
    status: str
    progress_percent: int
    valid_count: int
    invalid_count: int
    risky_count: int
    unknown_count: int
    rows: List[JobRowItem]
