from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

# Post schemas
class PostBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    category: Optional[str] = Field("General", max_length=50)

class PostCreate(PostBase):
    author_id: Optional[str] = "anonymous"

class PostUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None

class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    author_id: str
    content: str
    created_at: datetime

class PostResponse(PostBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    vote_count: int
    author_id: str
    created_at: datetime
    updated_at: datetime
    has_voted: bool = False
    comments_count: int = 0

class PostDetailResponse(PostResponse):
    comments: List[CommentResponse] = []

# Vote schemas
class VoteToggleRequest(BaseModel):
    post_id: int
    user_id: str

class VoteToggleResponse(BaseModel):
    post_id: int
    vote_count: int
    has_voted: bool
    action: str  # 'added' or 'removed'
    trace_id: str

# Comment schemas
class CommentCreate(BaseModel):
    author_id: Optional[str] = "anonymous"
    content: str = Field(..., min_length=1, max_length=2000)

# AI schemas
class DedupQueryRequest(BaseModel):
    title: str
    threshold: Optional[float] = 0.40

class DuplicateMatch(BaseModel):
    id: int
    title: str
    category: str
    status: str
    vote_count: int
    similarity: float

class DedupQueryResponse(BaseModel):
    query: str
    matches: List[DuplicateMatch]
    has_duplicate_warning: bool

class TagSuggestionRequest(BaseModel):
    title: str
    description: str

class TagSuggestionResponse(BaseModel):
    suggested_categories: List[str]

# Alert & On-Call schemas
class AlertTriggerRequest(BaseModel):
    alert_name: str
    severity: str = "critical"
    symptoms: str
    simulated_failure: Optional[bool] = True

class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    alert_name: str
    severity: str
    status: str
    symptoms: str
    root_cause: Optional[str] = None
    remediation_action: Optional[str] = None
    trace_id: Optional[str] = None
    postmortem_md: Optional[str] = None
    created_at: datetime
