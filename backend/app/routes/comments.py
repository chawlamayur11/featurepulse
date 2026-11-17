from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Post, Comment
from app.schemas import CommentCreate, CommentResponse
from app.telemetry.logger import logger, PIISanitizer, current_trace_id

router = APIRouter(prefix="/api/posts", tags=["comments"])

@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(post_id: int, payload: CommentCreate, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    clean_content = PIISanitizer.sanitize_text(payload.content)
    comment = Comment(
        post_id=post.id,
        author_id=payload.author_id or "anonymous",
        content=clean_content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    logger.info(
        f"New comment added to post #{post_id} by '{comment.author_id}'",
        extra_fields={
            "post_id": post_id,
            "comment_id": comment.id,
            "trace_id": current_trace_id.get()
        }
    )

    return comment
