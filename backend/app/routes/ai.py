from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Post
from app.schemas import (
    DedupQueryRequest,
    DedupQueryResponse,
    DuplicateMatch,
    TagSuggestionRequest,
    TagSuggestionResponse
)
from app.services.ai_service import find_duplicates, suggest_categories
from app.telemetry.logger import logger, current_trace_id
from app.telemetry.metrics import AI_DEDUP_QUERIES_TOTAL

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/dedup", response_model=DedupQueryResponse)
def check_duplicates(payload: DedupQueryRequest, db: Session = Depends(get_db)):
    all_posts = db.query(Post).all()
    threshold = payload.threshold if payload.threshold is not None else 0.40
    matches_raw = find_duplicates(payload.title, all_posts, threshold=threshold)

    matches = [
        DuplicateMatch(
            id=post.id,
            title=post.title,
            category=post.category,
            status=post.status,
            vote_count=post.vote_count,
            similarity=sim
        )
        for post, sim in matches_raw
    ]

    has_warning = any(m.similarity >= 0.60 for m in matches)
    AI_DEDUP_QUERIES_TOTAL.labels(has_match="true" if matches else "false").inc()

    logger.info(
        f"Ran AI deduplication query for '{payload.title}': found {len(matches)} potential matches",
        extra_fields={
            "query": payload.title,
            "match_count": len(matches),
            "trace_id": current_trace_id.get()
        }
    )

    return DedupQueryResponse(
        query=payload.title,
        matches=matches,
        has_duplicate_warning=has_warning
    )

@router.post("/suggest-tags", response_model=TagSuggestionResponse)
def suggest_tags(payload: TagSuggestionRequest):
    tags = suggest_categories(payload.title, payload.description)
    return TagSuggestionResponse(suggested_categories=tags)
