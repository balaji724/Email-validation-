import dns from 'node:dns/promises';
import { isDisposableDomain, isFreeProvider, isRoleBasedAccount } from './disposableDomains.js';

export type FinalStatus = 'VALID' | 'INVALID' | 'RISKY' | 'UNKNOWN';

export interface DetailedChecks {
  syntax: {
    valid: boolean;
    reason?: string;
  };
  domain: {
    name: string;
    validSyntax: boolean;
    isIDNA: boolean;
  };
  dns: {
    hasMx: boolean;
    hasFallbackA: boolean;
    mxRecords: string[];
    status: 'FOUND' | 'NO_RECORDS' | 'NXDOMAIN' | 'TIMEOUT' | 'ERROR';
    responseTimeMs?: number;
  };
  disposable: {
    isDisposable: boolean;
  };
  roleBased: {
    isRoleBased: boolean;
  };
  freeProvider: {
    isFree: boolean;
  };
}

export interface ValidationResult {
  originalEmail: string;
  normalizedEmail: string;
  localPart: string;
  domain: string;
  status: FinalStatus;
  score: number;
  comment: string;
  checks: DetailedChecks;
  isDuplicate?: boolean;
  validatedAt: string;
}

// DNS Cache to avoid redundant network roundtrips during bulk processing
interface DnsCacheEntry {
  status: 'FOUND' | 'NO_RECORDS' | 'NXDOMAIN' | 'TIMEOUT' | 'ERROR';
  hasMx: boolean;
  hasFallbackA: boolean;
  mxRecords: string[];
  timestamp: number;
}

const DNS_CACHE = new Map<string, DnsCacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Clean up expired DNS cache entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [domain, entry] of DNS_CACHE.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      DNS_CACHE.delete(domain);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Check basic RFC-compliant email syntax without over-restricting valid symbols
 */
function checkSyntax(email: string): { valid: boolean; reason?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Empty or missing email address' };
  }

  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { valid: false, reason: 'Email address cannot be blank' };
  }

  if (trimmed.length > 254) {
    return { valid: false, reason: 'Email address exceeds maximum length of 254 characters' };
  }

  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) {
    return { valid: false, reason: 'Missing "@" symbol' };
  }

  if (atIndex === 0) {
    return { valid: false, reason: 'Missing username before "@"' };
  }

  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex + 1);

  if (localPart.length > 64) {
    return { valid: false, reason: 'Username exceeds maximum length of 64 characters' };
  }

  if (!domainPart || domainPart.length === 0) {
    return { valid: false, reason: 'Missing domain after "@"' };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { valid: false, reason: 'Username cannot start or end with a period' };
  }

  if (localPart.includes('..')) {
    return { valid: false, reason: 'Username cannot contain consecutive periods' };
  }

  // Check valid domain syntax: labels separated by dots, each label 1-63 chars
  const domainLabels = domainPart.split('.');
  if (domainLabels.length < 2) {
    return { valid: false, reason: 'Domain must contain at least one period (e.g., domain.com)' };
  }

  for (const label of domainLabels) {
    if (!label || label.length > 63) {
      return { valid: false, reason: 'Domain contains invalid label length' };
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return { valid: false, reason: 'Domain label cannot start or end with a hyphen' };
    }
    // Allow alphanumeric and hyphens (and unicode for IDNA before punycode)
    if (!/^[a-zA-Z0-9\-\u0080-\uFFFF]+$/.test(label)) {
      return { valid: false, reason: `Domain label contains invalid characters: "${label}"` };
    }
  }

  const tld = domainLabels[domainLabels.length - 1];
  if (!/^[a-zA-Z]{2,}$/.test(tld) && !tld.startsWith('xn--')) {
    return { valid: false, reason: 'Top-level domain must be at least 2 characters long' };
  }

  return { valid: true };
}

/**
 * Query DNS for MX and fallback A/AAAA records with timeout
 */
async function queryDns(domain: string, timeoutMs = 2500): Promise<{
  status: 'FOUND' | 'NO_RECORDS' | 'NXDOMAIN' | 'TIMEOUT' | 'ERROR';
  hasMx: boolean;
  hasFallbackA: boolean;
  mxRecords: string[];
  responseTimeMs: number;
}> {
  const cached = DNS_CACHE.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      status: cached.status,
      hasMx: cached.hasMx,
      hasFallbackA: cached.hasFallbackA,
      mxRecords: cached.mxRecords,
      responseTimeMs: 0,
    };
  }

  const startTime = Date.now();
  let status: 'FOUND' | 'NO_RECORDS' | 'NXDOMAIN' | 'TIMEOUT' | 'ERROR' = 'NO_RECORDS';
  let hasMx = false;
  let hasFallbackA = false;
  let mxRecords: string[] = [];

  const timeoutPromise = new Promise<'TIMEOUT'>((resolve) =>
    setTimeout(() => resolve('TIMEOUT'), timeoutMs)
  );

  try {
    const dnsFetchPromise = (async () => {
      try {
        const mx = await dns.resolveMx(domain);
        if (mx && mx.length > 0) {
          hasMx = true;
          mxRecords = mx
            .sort((a, b) => a.priority - b.priority)
            .map((r) => r.exchange);
          return 'FOUND';
        }
      } catch (err: any) {
        if (err.code === 'ENOTFOUND') {
          return 'NXDOMAIN';
        }
        if (err.code === 'ETIMEOUT' || err.code === 'ECONNREFUSED') {
          return 'TIMEOUT';
        }
        // If NODATA, fallback to A/AAAA lookup per RFC 5321
      }

      // Check fallback A or AAAA records
      try {
        const [aRecs, aaaaRecs] = await Promise.allSettled([
          dns.resolve4(domain),
          dns.resolve6(domain),
        ]);

        const hasA = aRecs.status === 'fulfilled' && aRecs.value.length > 0;
        const hasAaaa = aaaaRecs.status === 'fulfilled' && aaaaRecs.value.length > 0;

        if (hasA || hasAaaa) {
          hasFallbackA = true;
          return 'FOUND';
        }
      } catch (err: any) {
        if (err.code === 'ENOTFOUND') return 'NXDOMAIN';
      }

      return 'NO_RECORDS';
    })();

    const result = await Promise.race([dnsFetchPromise, timeoutPromise]);
    if (result === 'TIMEOUT') {
      status = 'TIMEOUT';
    } else {
      status = result;
    }
  } catch {
    status = 'ERROR';
  }

  const responseTimeMs = Date.now() - startTime;

  DNS_CACHE.set(domain, {
    status,
    hasMx,
    hasFallbackA,
    mxRecords,
    timestamp: Date.now(),
  });

  return { status, hasMx, hasFallbackA, mxRecords, responseTimeMs };
}

export interface ValidateOptions {
  treatRoleAsRisky?: boolean;
  skipDns?: boolean;
}

/**
 * Validate an individual email address through the complete validation pipeline
 */
export async function validateSingleEmail(
  rawEmail: string,
  options: ValidateOptions = {}
): Promise<ValidationResult> {
  const originalEmail = rawEmail || '';
  const trimmed = originalEmail.trim();

  // 1. Normalization
  let localPart = '';
  let domainPart = '';
  let normalizedEmail = '';
  let isIDNA = false;

  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex > 0) {
    localPart = trimmed.slice(0, atIndex);
    domainPart = trimmed.slice(atIndex + 1).toLowerCase();
    // Support basic internationalized domain names (IDNA)
    try {
      if (/[^\u0000-\u007F]/.test(domainPart)) {
        isIDNA = true;
        // In Node 20+, URL domain parsing or toASCII can be used
        const punyUrl = new URL(`http://${domainPart}`);
        domainPart = punyUrl.hostname;
      }
    } catch {
      // Keep original domainPart if parsing fails
    }
    normalizedEmail = `${localPart}@${domainPart}`;
  } else {
    normalizedEmail = trimmed.toLowerCase();
  }

  // 2. Syntax validation
  const syntaxCheck = checkSyntax(trimmed);
  if (!syntaxCheck.valid) {
    return {
      originalEmail,
      normalizedEmail,
      localPart,
      domain: domainPart,
      status: 'INVALID',
      score: 0,
      comment: syntaxCheck.reason || 'Invalid email address syntax',
      checks: {
        syntax: { valid: false, reason: syntaxCheck.reason },
        domain: { name: domainPart, validSyntax: false, isIDNA },
        dns: { hasMx: false, hasFallbackA: false, mxRecords: [], status: 'NO_RECORDS' },
        disposable: { isDisposable: false },
        roleBased: { isRoleBased: false },
        freeProvider: { isFree: false },
      },
      validatedAt: new Date().toISOString(),
    };
  }

  // 3. Disposable and Role-based checks
  const isDisposable = isDisposableDomain(domainPart);
  const isRole = isRoleBasedAccount(localPart);
  const isFree = isFreeProvider(domainPart);

  // 4. DNS Mail Routing Check
  let dnsResult: {
    status: 'FOUND' | 'NO_RECORDS' | 'NXDOMAIN' | 'TIMEOUT' | 'ERROR';
    hasMx: boolean;
    hasFallbackA: boolean;
    mxRecords: string[];
    responseTimeMs?: number;
  } = {
    status: 'NO_RECORDS',
    hasMx: false,
    hasFallbackA: false,
    mxRecords: [],
  };

  if (!options.skipDns) {
    dnsResult = await queryDns(domainPart);
  }

  // 5. Result classification and scoring
  let finalStatus: FinalStatus = 'VALID';
  let score = 95;
  let comment = 'Valid mailbox syntax and active mail server records';

  if (dnsResult.status === 'NXDOMAIN') {
    finalStatus = 'INVALID';
    score = 5;
    comment = `Domain "${domainPart}" does not exist (NXDOMAIN)`;
  } else if (dnsResult.status === 'NO_RECORDS') {
    finalStatus = 'INVALID';
    score = 10;
    comment = `Domain "${domainPart}" has no active MX or mail routing records`;
  } else if (dnsResult.status === 'TIMEOUT' || dnsResult.status === 'ERROR') {
    finalStatus = 'UNKNOWN';
    score = 50;
    comment = 'DNS lookup timed out or temporary resolver error; deliverability cannot be guaranteed';
  } else if (isDisposable) {
    finalStatus = 'RISKY';
    score = 25;
    comment = 'Temporary or disposable email address; high bounce and churn risk';
  } else if (isRole && (options.treatRoleAsRisky ?? true)) {
    finalStatus = 'RISKY';
    score = 70;
    comment = 'Role-based team account (e.g., info@, support@, sales@); low direct personal response';
  } else if (!dnsResult.hasMx && dnsResult.hasFallbackA) {
    finalStatus = 'RISKY';
    score = 65;
    comment = 'Domain lacks explicit MX records; relies on implicit A/AAAA fallback mail routing';
  } else {
    // Valid
    if (isFree) {
      score = 90;
      comment = 'Valid syntax with verified public webmail provider';
    } else {
      score = 98;
      comment = 'Valid corporate mailbox with verified mail exchange (MX) servers';
    }
  }

  return {
    originalEmail,
    normalizedEmail,
    localPart,
    domain: domainPart,
    status: finalStatus,
    score,
    comment,
    checks: {
      syntax: { valid: true },
      domain: { name: domainPart, validSyntax: true, isIDNA },
      dns: {
        hasMx: dnsResult.hasMx,
        hasFallbackA: dnsResult.hasFallbackA,
        mxRecords: dnsResult.mxRecords,
        status: dnsResult.status,
        responseTimeMs: dnsResult.responseTimeMs,
      },
      disposable: { isDisposable },
      roleBased: { isRoleBased: isRole },
      freeProvider: { isFree },
    },
    validatedAt: new Date().toISOString(),
  };
}
