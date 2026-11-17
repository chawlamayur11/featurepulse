from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(50), default="General", index=True)
    status = Column(String(30), default="open", index=True)  # open, under_review, planned, in_progress, completed
    vote_count = Column(Integer, default=1, index=True)
    author_id = Column(String(100), default="anonymous")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    votes = relationship("Vote", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="votes")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_post_user_vote"),
    )

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(100), default="anonymous")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="comments")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    alert_name = Column(String(100), nullable=False)
    severity = Column(String(20), default="warning")  # warning, critical
    status = Column(String(20), default="firing")     # firing, investigating, resolved
    symptoms = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=True)
    remediation_action = Column(Text, nullable=True)
    trace_id = Column(String(64), nullable=True, index=True)
    postmortem_md = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
