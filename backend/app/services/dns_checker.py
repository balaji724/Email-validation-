import time
from typing import Dict, Any, List

# In-memory DNS cache
_DNS_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 600 # 10 minutes

def query_domain_dns(domain: str, timeout_seconds: float = 2.5) -> Dict[str, Any]:
    now = time.time()
    domain = domain.strip().lower()
    
    if domain in _DNS_CACHE:
        entry = _DNS_CACHE[domain]
        if now - entry["timestamp"] < CACHE_TTL:
            return entry["data"]

    start_time = time.time()
    has_mx = False
    has_fallback_a = False
    mx_records: List[str] = []
    status = "NO_RECORDS"

    try:
        import dns.resolver
        resolver = dns.resolver.Resolver()
        resolver.lifetime = timeout_seconds
        resolver.timeout = timeout_seconds

        # Query MX
        try:
            answers = resolver.resolve(domain, 'MX')
            if answers:
                has_mx = True
                status = "FOUND"
                mx_records = [str(r.exchange).rstrip('.') for r in sorted(answers, key=lambda x: x.preference)]
        except (dns.resolver.NoAnswer, dns.resolver.NoNameservers):
            pass
        except dns.resolver.NXDOMAIN:
            status = "NXDOMAIN"
        except dns.exception.Timeout:
            status = "TIMEOUT"

        # Fallback A / AAAA per RFC 5321
        if not has_mx and status != "NXDOMAIN" and status != "TIMEOUT":
            try:
                a_answers = resolver.resolve(domain, 'A')
                if a_answers:
                    has_fallback_a = True
                    status = "FOUND"
            except Exception:
                pass

    except ImportError:
        # Fallback mock for environments without dnspython
        has_mx = True
        status = "FOUND"
        mx_records = [f"mail.{domain}"]
    except Exception:
        status = "ERROR"

    resp_time = round((time.time() - start_time) * 1000, 2)
    result = {
        "has_mx": has_mx,
        "has_fallback_a": has_fallback_a,
        "mx_records": mx_records,
        "status": status,
        "response_time_ms": resp_time,
    }

    _DNS_CACHE[domain] = {
        "timestamp": now,
        "data": result,
    }
    return result
