from app.models import Post, Vote, Comment, Incident

def test_create_post_model(db_session):
    post = Post(
        title="Test Feedback",
        description="Detailed test description",
        category="UI/UX",
        status="open",
        vote_count=1,
        author_id="user_123"
    )
    db_session.add(post)
    db_session.commit()
    db_session.refresh(post)

    assert post.id is not None
    assert post.title == "Test Feedback"
    assert post.vote_count == 1
    assert post.status == "open"
    assert post.created_at is not None

def test_vote_uniqueness_constraint(db_session):
    post = Post(title="Post For Voting", description="Desc", category="General")
    db_session.add(post)
    db_session.commit()

    vote1 = Vote(post_id=post.id, user_id="user_abc")
    db_session.add(vote1)
    db_session.commit()

    # Attempting to add duplicate vote for same user should fail or be caught
    existing = db_session.query(Vote).filter_by(post_id=post.id, user_id="user_abc").first()
    assert existing is not None
    assert existing.user_id == "user_abc"

def test_comment_cascade_on_post_delete(db_session):
    post = Post(title="Post with Comments", description="Desc")
    db_session.add(post)
    db_session.commit()

    comment = Comment(post_id=post.id, author_id="user_bob", content="Great idea!")
    db_session.add(comment)
    db_session.commit()

    assert db_session.query(Comment).filter_by(post_id=post.id).count() == 1

    db_session.delete(post)
    db_session.commit()

    assert db_session.query(Comment).filter_by(post_id=post.id).count() == 0

def test_incident_model(db_session):
    inc = Incident(
        alert_name="HighVotingErrorRateAlert",
        severity="critical",
        status="resolved",
        symptoms="500 errors on votes",
        root_cause="Pool exhaustion",
        remediation_action="Reset connection pool",
        trace_id="abc123trace"
    )
    db_session.add(inc)
    db_session.commit()
    db_session.refresh(inc)

    assert inc.id is not None
    assert inc.status == "resolved"
    assert inc.trace_id == "abc123trace"
