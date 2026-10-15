# Validation Engine Specification & Rules

## 1. Pipeline Stages

The verification pipeline executes in the following sequence:

1. **Normalization**:
   - Trim leading/trailing whitespace without mutating local parts.
   - Convert domain part to lowercase.
   - Internationalized domain name (IDNA) conversion to ASCII punycode where applicable.
   - Detect empty strings and non-string types.

2. **RFC 5322 Syntax Verification**:
   - Check length bounds: local part $\le 64$ characters, total address $\le 254$ characters.
   - Ensure presence of exactly one `@` separator.
   - Verify local-part character legality.
   - Disallow consecutive periods (`..`) or leading/trailing periods in local-part.
   - Validate domain syntax and label lengths ($\le 63$ characters per label).
   - Ensure top-level domain (TLD) is $\ge 2$ alphabetic characters.

3. **Authoritative DNS & MX Resolution**:
   - Query authoritative DNS nameservers for Mail Exchanger (`MX`) resource records.
   - If MX records exist, sort by preference integer.
   - If MX records do not exist, fall back to address records (`A`/`AAAA`) per RFC 5321 section 5.1.
   - Handle explicit `NXDOMAIN` (domain does not exist) vs. `TIMEOUT` (inconclusive query).

4. **Disposable & Temporary Domain Detection**:
   - Cross-reference domain against maintained list of 350+ disposable providers (e.g., Mailinator, TempMail, Yopmail).
   - Flag as high risk for marketing churn and unmonitored mailboxes.

5. **Role-Based Mailbox Classification**:
   - Detect generic team prefixes (`info`, `support`, `sales`, `admin`, `billing`, `contact`, `hello`, `careers`).
   - Flag as lower individual engagement.

6. **In-File Duplicate Detection**:
   - In bulk jobs, normalize addresses and record the first row occurrence. Subsequent identical addresses are flagged as `isDuplicate: true` with a cross-reference note.

## 2. Confidence Scoring Algorithm

The score is an architectural deliverability index (0–100):

| Signal State | Status | Score | Rationale |
|---|---|---|---|
| Malformed Syntax | INVALID | 0 | Cannot be parsed by SMTP gateways. |
| Non-Existent Domain (NXDOMAIN) | INVALID | 5 | Domain is unassigned or expired. |
| No MX / Address Records | INVALID | 10 | Host exists but accepts no inbound mail. |
| Disposable Domain | RISKY | 25 | Burner address; expires within minutes/days. |
| DNS Timeout / Error | UNKNOWN | 50 | Inconclusive check; do not auto-delete. |
| Fallback A-Record Routing | RISKY | 65 | Implicit mail routing; no dedicated MX cluster. |
| Role-Based Address | RISKY | 70 | Shared team inbox; low direct response rate. |
| Verified Free Webmail (Gmail/Yahoo) | VALID | 90 | Public provider; active MX cluster. |
| Verified Corporate MX Domain | VALID | 98 | Dedicated enterprise mail exchanger. |
