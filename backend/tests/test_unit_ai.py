from app.models import Post
from app.services.ai_service import compute_similarity, find_duplicates, suggest_categories

def test_compute_similarity_identical():
    sim = compute_similarity("Add dark mode theme", "Add dark mode theme")
    assert sim >= 0.95

def test_compute_similarity_high_overlap():
    sim = compute_similarity("Add dark theme to UI", "Enable dark mode theme")
    assert sim >= 0.35

def test_compute_similarity_unrelated():
    sim = compute_similarity("Two-factor authentication 2FA", "Export database to CSV")
    assert sim < 0.20

def test_find_duplicates():
    posts = [
        Post(id=1, title="Support dark mode theme", description="Night theme", category="UI/UX"),
        Post(id=2, title="Slack webhook notifications", description="Webhook alerts", category="Integrations"),
        Post(id=3, title="Export roadmap to CSV and JSON", description="CSV downloads", category="Core Feature")
    ]

    duplicates = find_duplicates("dark mode support please", posts, threshold=0.40)
    assert len(duplicates) >= 1
    top_match_post, score = duplicates[0]
    assert top_match_post.id == 1
    assert score > 0.40

def test_suggest_categories():
    assert "UI/UX" in suggest_categories("Implement new dark theme layout", "Change font and colors")
    assert "Integrations" in suggest_categories("Add Slack notifications", "Send webhooks to channel")
    assert "Security" in suggest_categories("Enable 2FA login", "Require authentication password")
    assert "Performance" in suggest_categories("Optimize slow database queries", "Speed up dashboard latency")
