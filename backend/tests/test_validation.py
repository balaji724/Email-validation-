import pytest
from backend.app.services.email_validator import validate_syntax, validate_email
from backend.app.services.disposable_checker import is_disposable_domain, is_role_based
from backend.app.services.export_service import sanitize_csv_cell

def test_syntax_valid_email():
    res = validate_syntax("user@example.com")
    assert res["valid"] is True

def test_syntax_missing_at():
    res = validate_syntax("userexample.com")
    assert res["valid"] is False
    assert "symbol" in res["reason"]

def test_syntax_missing_domain():
    res = validate_syntax("user@")
    assert res["valid"] is False

def test_syntax_empty_string():
    res = validate_syntax("")
    assert res["valid"] is False

def test_syntax_whitespace_handling():
    res = validate_email("  user@example.com  ")
    assert res["normalized_email"] == "user@example.com"

def test_syntax_consecutive_dots():
    res = validate_syntax("bad..user@example.com")
    assert res["valid"] is False
    assert "consecutive periods" in res["reason"]

def test_disposable_detection():
    assert is_disposable_domain("mailinator.com") is True
    assert is_disposable_domain("temp-mail.org") is True
    assert is_disposable_domain("microsoft.com") is False

def test_role_based_detection():
    assert is_role_based("support") is True
    assert is_role_based("info") is True
    assert is_role_based("sarah.smith") is False

def test_formula_injection_sanitization():
    # Dangerous Excel formula commands
    assert sanitize_csv_cell("=1+1") == "'=1+1"
    assert sanitize_csv_cell("+cmd|' /C calc'!A0") == "'+cmd|' /C calc'!A0"
    assert sanitize_csv_cell("-2+3") == "'-2+3"
    assert sanitize_csv_cell("@SUM(1,2)") == "'@SUM(1,2)"
    assert sanitize_csv_cell("normal text") == "normal text"
