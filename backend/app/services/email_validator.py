import re
from datetime import datetime
from typing import Dict, Any
from backend.app.services.disposable_checker import is_disposable_domain, is_free_provider, is_role_based
from backend.app.services.dns_checker import query_domain_dns

def validate_syntax(email: str) -> Dict[str, Any]:
    if not email or not isinstance(email, str):
        return {"valid": False, "reason": "Empty email address"}
    
    trimmed = email.strip()
    if len(trimmed) == 0:
        return {"valid": False, "reason": "Email address cannot be blank"}
    if len(trimmed) > 254:
        return {"valid": False, "reason": "Email exceeds maximum length of 254 characters"}
    
    parts = trimmed.split('@')
    if len(parts) != 2:
        return {"valid": False, "reason": "Email must contain exactly one '@' symbol"}
    
    local_part, domain = parts
    if not local_part or len(local_part) > 64:
        return {"valid": False, "reason": "Invalid local part length (1-64 characters required)"}
    if not domain:
        return {"valid": False, "reason": "Domain part cannot be empty"}
    
    if local_part.startswith('.') or local_part.endswith('.'):
        return {"valid": False, "reason": "Local part cannot start or end with a period"}
    if '..' in local_part:
        return {"valid": False, "reason": "Local part cannot contain consecutive periods"}
    
    domain_labels = domain.split('.')
    if len(domain_labels) < 2:
        return {"valid": False, "reason": "Domain must contain a top-level domain extension"}
    
    for label in domain_labels:
        if not label or len(label) > 63:
            return {"valid": False, "reason": "Domain contains invalid label length"}
        if label.startswith('-') or label.endswith('-'):
            return {"valid": False, "reason": "Domain label cannot start or end with a hyphen"}
    
    tld = domain_labels[-1]
    if len(tld) < 2:
        return {"valid": False, "reason": "Top-level domain must be at least 2 characters"}
        
    return {"valid": True}

def validate_email(raw_email: str, treat_role_as_risky: bool = True) -> Dict[str, Any]:
    original = raw_email or ""
    trimmed = original.strip()
    
    # Normalization
    local_part = ""
    domain_part = ""
    is_idna = False
    
    if '@' in trimmed:
        local_part, domain_part = trimmed.rsplit('@', 1)
        domain_part = domain_part.lower()
        try:
            domain_part = domain_part.encode('idna').decode('ascii')
            if any(ord(c) > 127 for c in original):
                is_idna = True
        except Exception:
            pass
        normalized = f"{local_part}@{domain_part}"
    else:
        normalized = trimmed.lower()

    # Syntax check
    syntax_res = validate_syntax(trimmed)
    if not syntax_res["valid"]:
        return {
            "original_email": original,
            "normalized_email": normalized,
            "local_part": local_part,
            "domain": domain_part,
            "status": "INVALID",
            "score": 0,
            "comment": syntax_res["reason"],
            "checks": {
                "syntax": {"valid": False, "reason": syntax_res["reason"]},
                "domain": {"name": domain_part, "valid_syntax": False, "is_idna": is_idna},
                "dns": {"has_mx": False, "has_fallback_a": False, "mx_records": [], "status": "NO_RECORDS"},
                "disposable": {"is_disposable": False},
                "role_based": {"is_role_based": False},
                "free_provider": {"is_free": False},
            },
            "is_duplicate": False,
            "validated_at": datetime.utcnow().isoformat(),
        }

    # Signals
    disposable = is_disposable_domain(domain_part)
    role_acc = is_role_based(local_part)
    free_prov = is_free_provider(domain_part)
    
    dns_info = query_domain_dns(domain_part)
    
    # Classification & Scoring
    final_status = "VALID"
    score = 95
    comment = "Valid mailbox syntax and active mail server records"
    
    if dns_info["status"] == "NXDOMAIN":
        final_status = "INVALID"
        score = 5
        comment = f'Domain "{domain_part}" does not exist (NXDOMAIN)'
    elif dns_info["status"] == "NO_RECORDS":
        final_status = "INVALID"
        score = 10
        comment = f'Domain "{domain_part}" has no active MX or mail routing records'
    elif dns_info["status"] in ("TIMEOUT", "ERROR"):
        final_status = "UNKNOWN"
        score = 50
        comment = "DNS resolution timed out; deliverability inconclusive"
    elif disposable:
        final_status = "RISKY"
        score = 25
        comment = "Temporary or disposable burner mailbox; high bounce/churn risk"
    elif role_acc and treat_role_as_risky:
        final_status = "RISKY"
        score = 70
        comment = "Role-based team mailbox (info@, sales@, etc.); low personal engagement"
    elif not dns_info["has_mx"] and dns_info["has_fallback_a"]:
        final_status = "RISKY"
        score = 65
        comment = "Domain lacks explicit MX records; relies on implicit A-record fallback"
    else:
        if free_prov:
            score = 90
            comment = "Valid syntax with verified public webmail provider"
        else:
            score = 98
            comment = "Valid corporate mailbox with verified mail exchange (MX) servers"

    return {
        "original_email": original,
        "normalized_email": normalized,
        "local_part": local_part,
        "domain": domain_part,
        "status": final_status,
        "score": score,
        "comment": comment,
        "checks": {
            "syntax": {"valid": True},
            "domain": {"name": domain_part, "valid_syntax": True, "is_idna": is_idna},
            "dns": dns_info,
            "disposable": {"is_disposable": disposable},
            "role_based": {"is_role_based": role_acc},
            "free_provider": {"is_free": free_prov},
        },
        "is_duplicate": False,
        "validated_at": datetime.utcnow().isoformat(),
    }
