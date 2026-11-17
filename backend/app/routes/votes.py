from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import Post, Vote
from app.schemas import VoteToggleRequest, VoteToggleResponse
from app.telemetry.logger import logger, current_trace_id, current_span_id
from app.telemetry.metrics import UPVOTES_TOTAL
from app.telemetry.tracer import TraceSpan, generate_span_id

router = APIRouter(prefix="/api/votes", tags=["votes"])

@router.post("", response_model=VoteToggleResponse)
def toggle_vote(payload: VoteToggleRequest, db: Session = Depends(get_db)):
    trace_id = current_trace_id.get() or "trace_vote_local"
    parent_span_id = current_span_id.get()
    span_id = generate_span_id()
    span = TraceSpan(name="api.vote_post", trace_id=trace_id, span_id=span_id, parent_id=parent_span_id)
    span.set_attribute("post.id", payload.post_id)

    # Check if user is quarantined by On-Call Agent
    if payload.user_id in settings.QUARANTINED_USERS:
        span.finish(status="ERROR")
        logger.warning(
            f"Blocked quarantined user '{payload.user_id}' from voting on post #{payload.post_id}",
            extra_fields={"user_id": payload.user_id, "post_id": payload.post_id}
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Client temporarily throttled due to abnormal voting velocity."
        )

    # Find the post
    post = db.query(Post).filter(Post.id == payload.post_id).first()
    if not post:
        span.finish(status="ERROR")
        raise HTTPException(status_code=404, detail="Feedback post not found")

    # Check existing vote
    existing_vote = db.query(Vote).filter(
        Vote.post_id == payload.post_id,
        Vote.user_id == payload.user_id
    ).first()

    if existing_vote:
        # User un-votes
        db.delete(existing_vote)
        post.vote_count = max(0, post.vote_count - 1)
        action = "removed"
        has_voted = False
        UPVOTES_TOTAL.labels(action="removed").inc()
    else:
        # User votes
        new_vote = Vote(post_id=payload.post_id, user_id=payload.user_id)
        db.add(new_vote)
        post.vote_count += 1
        action = "added"
        has_voted = True
        UPVOTES_TOTAL.labels(action="added").inc()

    db.commit()
    db.refresh(post)

    span.set_attribute("vote.action", action)
    span.set_attribute("post.vote_count", post.vote_count)
    span.finish(status="OK")

    logger.info(
        f"Vote {action} for post #{post.id} (Total: {post.vote_count})",
        extra_fields={
            "post_id": post.id,
            "action": action,
            "vote_count": post.vote_count,
            "trace_id": trace_id
        }
    )

    return VoteToggleResponse(
        post_id=post.id,
        vote_count=post.vote_count,
        has_voted=has_voted,
        action=action,
        trace_id=trace_id
    )
