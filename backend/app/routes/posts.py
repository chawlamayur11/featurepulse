from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import Post, Vote, Comment
from app.schemas import PostCreate, PostResponse, PostDetailResponse, PostUpdate
from app.telemetry.logger import logger, PIISanitizer, current_trace_id
from app.telemetry.metrics import FEEDBACK_POSTS_TOTAL

router = APIRouter(prefix="/api/posts", tags=["posts"])

@router.get("", response_model=List[PostResponse])
def list_posts(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    sort_by: str = Query("top", pattern="^(top|newest|trending)$"),
    user_id: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Post)

    if status_filter and status_filter != "all":
        query = query.filter(Post.status == status_filter)

    if category and category != "all":
        query = query.filter(Post.category == category)

    if search:
        query = query.filter(Post.title.ilike(f"%{search}%"))

    if sort_by == "top":
        query = query.order_by(desc(Post.vote_count), desc(Post.created_at))
    elif sort_by == "newest":
        query = query.order_by(desc(Post.created_at))
    elif sort_by == "trending":
        # Trending: high vote count + recently updated/created
        query = query.order_by(desc(Post.vote_count), desc(Post.updated_at))

    posts = query.all()

    # Pre-fetch user's voted post IDs if user_id is provided
    user_voted_ids = set()
    if user_id:
        voted_tuples = db.query(Vote.post_id).filter(Vote.user_id == user_id).all()
        user_voted_ids = {v[0] for v in voted_tuples}

    results = []
    for p in posts:
        comments_cnt = db.query(Comment).filter(Comment.post_id == p.id).count()
        results.append(PostResponse(
            id=p.id,
            title=p.title,
            description=p.description,
            category=p.category,
            status=p.status,
            vote_count=p.vote_count,
            author_id=p.author_id,
            created_at=p.created_at,
            updated_at=p.updated_at,
            has_voted=p.id in user_voted_ids,
            comments_count=comments_cnt
        ))

    return results

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(payload: PostCreate, db: Session = Depends(get_db)):
    # Sanitize free-text fields to prevent PII leakage
    clean_title = PIISanitizer.sanitize_text(payload.title)
    clean_desc = PIISanitizer.sanitize_text(payload.description)

    post = Post(
        title=clean_title,
        description=clean_desc,
        category=payload.category or "General",
        status="open",
        vote_count=1,
        author_id=payload.author_id or "anonymous"
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Initial vote by creator
    initial_vote = Vote(post_id=post.id, user_id=post.author_id)
    db.add(initial_vote)
    db.commit()

    # Telemetry updates
    FEEDBACK_POSTS_TOTAL.labels(category=post.category, status=post.status).inc()
    logger.info(
        f"Created feedback post #{post.id}: '{post.title}'",
        extra_fields={
            "post_id": post.id,
            "category": post.category,
            "trace_id": current_trace_id.get()
        }
    )

    return PostResponse(
        id=post.id,
        title=post.title,
        description=post.description,
        category=post.category,
        status=post.status,
        vote_count=post.vote_count,
        author_id=post.author_id,
        created_at=post.created_at,
        updated_at=post.updated_at,
        has_voted=True,
        comments_count=0
    )

@router.get("/{post_id}", response_model=PostDetailResponse)
def get_post(post_id: int, user_id: Optional[str] = None, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    has_voted = False
    if user_id:
        has_voted = db.query(Vote).filter(Vote.post_id == post.id, Vote.user_id == user_id).first() is not None

    comments = db.query(Comment).filter(Comment.post_id == post.id).order_by(Comment.created_at).all()

    return PostDetailResponse(
        id=post.id,
        title=post.title,
        description=post.description,
        category=post.category,
        status=post.status,
        vote_count=post.vote_count,
        author_id=post.author_id,
        created_at=post.created_at,
        updated_at=post.updated_at,
        has_voted=has_voted,
        comments_count=len(comments),
        comments=comments
    )

@router.patch("/{post_id}/status", response_model=PostResponse)
def update_post_status(post_id: int, payload: PostUpdate, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if payload.status:
        valid_statuses = {"open", "under_review", "planned", "in_progress", "completed"}
        if payload.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        post.status = payload.status

    if payload.category:
        post.category = payload.category

    db.commit()
    db.refresh(post)

    logger.info(
        f"Updated post #{post.id} status to '{post.status}'",
        extra_fields={"post_id": post.id, "new_status": post.status}
    )

    comments_cnt = db.query(Comment).filter(Comment.post_id == post.id).count()
    return PostResponse(
        id=post.id,
        title=post.title,
        description=post.description,
        category=post.category,
        status=post.status,
        vote_count=post.vote_count,
        author_id=post.author_id,
        created_at=post.created_at,
        updated_at=post.updated_at,
        has_voted=False,
        comments_count=comments_cnt
    )

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    logger.info(f"Deleted post #{post_id}")
    return None
