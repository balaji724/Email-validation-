from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SyntaxCheck(BaseModel):
    valid: bool
    reason: Optional[str] = None

class DomainCheck(BaseModel):
    name: str
    valid_syntax: bool
    is_idna: bool

class DnsCheck(BaseModel):
    has_mx: bool
    has_fallback_a: bool
    mx_records: List[str]
    status: str
    response_time_ms: Optional[float] = None

class DisposableCheck(BaseModel):
    is_disposable: bool

class RoleBasedCheck(BaseModel):
    is_role_based: bool

class FreeProviderCheck(BaseModel):
    is_free: bool

class DetailedChecks(BaseModel):
    syntax: SyntaxCheck
    domain: DomainCheck
    dns: DnsCheck
    disposable: DisposableCheck
    role_based: RoleBasedCheck
    free_provider: FreeProviderCheck

class SingleValidationRequest(BaseModel):
    email: str = Field(..., example="sarah.connor@cyberdyne.org")
    treat_role_as_risky: bool = True

class SingleValidationResponse(BaseModel):
    original_email: str
    normalized_email: str
    local_part: str
    domain: str
    status: str # VALID, INVALID, RISKY, UNKNOWN
    score: int
    comment: str
    checks: DetailedChecks
    is_duplicate: Optional[bool] = False
    validated_at: datetime
