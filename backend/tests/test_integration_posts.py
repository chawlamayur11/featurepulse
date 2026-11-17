def test_create_and_get_post(client):
    # Test POST /api/posts with PII scrubbing
    payload = {
        "title": "Add Webhook Support",
        "description": "Please notify user@corp.com when events trigger.",
        "category": "Integrations",
        "author_id": "client_session_1"
    }
    response = client.post("/api/posts", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["title"] == "Add Webhook Support"
    # PII should be sanitized
    assert "user@corp.com" not in data["description"]
    assert "[REDACTED_EMAIL]" in data["description"]
    assert data["vote_count"] == 1
    assert "X-Trace-Id" in response.headers

    # Test GET /api/posts
    list_res = client.get("/api/posts")
    assert list_res.status_code == 200
    posts = list_res.json()
    assert len(posts) >= 1

    # Test GET /api/posts/{id}
    post_id = data["id"]
    detail_res = client.get(f"/api/posts/{post_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["title"] == "Add Webhook Support"

def test_update_post_status(client):
    # Create post
    payload = {"title": "Update Status Test", "description": "Status test desc"}
    create_res = client.post("/api/posts", json=payload)
    post_id = create_res.json()["id"]

    # Patch status
    patch_res = client.patch(f"/api/posts/{post_id}/status", json={"status": "in_progress"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "in_progress"

def test_add_comment(client):
    create_res = client.post("/api/posts", json={"title": "Comment Test", "description": "Comment test desc"})
    post_id = create_res.json()["id"]

    comment_res = client.post(
        f"/api/posts/{post_id}/comments",
        json={"author_id": "reviewer_1", "content": "Reach me at test@example.com"}
    )
    assert comment_res.status_code == 201
    comment_data = comment_res.json()
    assert "[REDACTED_EMAIL]" in comment_data["content"]
