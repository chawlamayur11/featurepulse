def test_toggle_vote_journey(client):
    # 1. Create a post
    post_res = client.post("/api/posts", json={
        "title": "Vote Journey Test",
        "description": "Checking vote toggles and traces"
    })
    post_id = post_res.json()["id"]
    initial_votes = post_res.json()["vote_count"]

    # 2. Another user votes for the post
    voter_id = "voter_session_99"
    vote_res = client.post(
        "/api/votes",
        json={"post_id": post_id, "user_id": voter_id},
        headers={"traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"}
    )
    assert vote_res.status_code == 200
    vote_data = vote_res.json()
    assert vote_data["has_voted"] is True
    assert vote_data["action"] == "added"
    assert vote_data["vote_count"] == initial_votes + 1
    assert "X-Trace-Id" in vote_res.headers

    # 3. Same user votes again -> idempotent toggle (un-vote)
    unvote_res = client.post(
        "/api/votes",
        json={"post_id": post_id, "user_id": voter_id}
    )
    assert unvote_res.status_code == 200
    unvote_data = unvote_res.json()
    assert unvote_data["has_voted"] is False
    assert unvote_data["action"] == "removed"
    assert unvote_data["vote_count"] == initial_votes
