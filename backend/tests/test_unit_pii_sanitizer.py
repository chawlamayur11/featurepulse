from app.telemetry.logger import PIISanitizer

def test_sanitize_email():
    raw = "Contact the user at alice.johnson@example.com for more details."
    sanitized = PIISanitizer.sanitize_text(raw)
    assert "alice.johnson@example.com" not in sanitized
    assert "[REDACTED_EMAIL]" in sanitized

def test_sanitize_phone():
    raw = "Call me at +1 (555) 123-4567 regarding the bug."
    sanitized = PIISanitizer.sanitize_text(raw)
    assert "123-4567" not in sanitized
    assert "[REDACTED_PHONE]" in sanitized

def test_sanitize_bearer_token():
    raw = "Header Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"
    sanitized = PIISanitizer.sanitize_text(raw)
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in sanitized
    assert "[REDACTED_TOKEN]" in sanitized

def test_sanitize_dictionary():
    payload = {
        "user_email": "bob@domain.org",
        "api_key": "secret_live_key_9999",
        "nested": {
            "token": "sensitive_data"
        }
    }
    sanitized = PIISanitizer.sanitize_dict(payload)
    assert sanitized["user_email"] == "[REDACTED_EMAIL]"
    assert sanitized["api_key"] == "[REDACTED]"
    assert sanitized["nested"]["token"] == "[REDACTED]"
