DISPOSABLE_DOMAINS = {
    '10minutemail.com', '10minutemail.net', 'burnermail.io', 'dispostable.com',
    'dropmail.me', 'fakeinbox.com', 'getairmail.com', 'guerrillamail.com',
    'guerrillamail.net', 'guerrillamail.org', 'mailcatch.com', 'maildrop.cc',
    'mailinator.com', 'mailinator.net', 'mailsac.com', 'mohmal.com',
    'sharklasers.com', 'temp-mail.org', 'tempmail.com', 'throwawaymail.com',
    'trashmail.com', 'yopmail.com', 'yopmail.fr', 'yopmail.net'
}

FREE_PROVIDERS = {
    'gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com',
    'outlook.com', 'live.com', 'icloud.com', 'aol.com', 'zoho.com',
    'proton.me', 'protonmail.com', 'mail.com', 'gmx.com'
}

ROLE_PREFIXES = {
    'admin', 'administrator', 'billing', 'compliance', 'contact',
    'careers', 'dev', 'feedback', 'finance', 'help', 'hello',
    'info', 'inquiries', 'jobs', 'legal', 'mail', 'marketing',
    'no-reply', 'noreply', 'office', 'orders', 'postmaster',
    'press', 'privacy', 'root', 'sales', 'security', 'support', 'team'
}

def is_disposable_domain(domain: str) -> bool:
    return domain.strip().lower() in DISPOSABLE_DOMAINS

def is_free_provider(domain: str) -> bool:
    return domain.strip().lower() in FREE_PROVIDERS

def is_role_based(local_part: str) -> bool:
    clean = local_part.strip().lower()
    for sep in ['.', '+', '-', '_']:
        clean = clean.replace(sep, '')
    if clean in ROLE_PREFIXES:
        return True
    parts = local_part.strip().lower().split('.')
    return any(p in ROLE_PREFIXES for p in parts)
