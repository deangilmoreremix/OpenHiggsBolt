import { checkDestination, isBlockedHostname, isIpLiteral } from './networkSafety';

// NOTE: isBlockedFileType() is used by legacy proxy routes but not by the
// direct upload route. The direct upload route (/api/v1/upload_file) uses
// its own MIME allowlist (ALLOWED_UPLOAD_MIME_TYPES) instead of relying on
// this blocked-file check.
//
// Every IP / hostname / DNS-rebinding rule now lives in the single shared
// module ./networkSafety, so the upload proxy cannot drift away from the
// discovery path. This file owns only the S3 destination allowlist and the
// upload-specific file rules.

const DEFAULT_S3_REGION_PATTERN = /^[a-z0-9-]+$/;

function normalizeHostname(hostname) {
    return hostname.toLowerCase().replace(/\.$/, '');
}

function parseAllowedHosts(env) {
    return (env.UPLOAD_PROXY_ALLOWED_HOSTS || '')
        .split(',')
        .map((host) => normalizeHostname(host.trim()))
        .filter(Boolean);
}

function isBlockedHost(hostname) {
    const normalized = normalizeHostname(hostname).replace(/^\[|\]$/g, '');

    return isBlockedHostname(normalized) || isIpLiteral(normalized);
}

function isAllowedS3Host(hostname, allowedHosts = []) {
    // Reject empty labels (leading dot, trailing dot, or consecutive dots).
    if (hostname.split('.').some((label) => label === '')) {
        return false;
    }

    // Allow exact matches from UPLOAD_PROXY_ALLOWED_HOSTS
    if (allowedHosts.includes(hostname)) {
        return true;
    }

    // Exact S3 endpoint shapes (bucket names permit a single character):
    //   bucket.s3.amazonaws.com                       global
    //   bucket.s3-<region>.amazonaws.com              regional
    //   bucket.s3.<region>.amazonaws.com              regional / dualstack
    //   bucket.s3.<region>.dualstack.amazonaws.com    dualstack tail
    //   bucket.s3.dualstack.<region>.amazonaws.com    dualstack prefix
    // Anchored at both ends so a lookalike host (e.g. s3.amazonaws.com.evil.tld)
    // cannot match.
    if (/^[a-z0-9](?:[a-z0-9.\-]*[a-z0-9])?\.s3(?:[.-][a-z0-9-]+){0,4}\.amazonaws\.com$/.test(hostname)) {
        return true;
    }

    return false;
}

export function getApiKeyFromRequest(request) {
    if (!request || !request.headers) return null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        if (token) return token;
    }
    const headerKey = request.headers.get('x-api-key');
    if (headerKey && headerKey.trim()) {
        return headerKey.trim();
    }
    return null;
}

const BLOCKED_EXTENSIONS = new Set([
    'html', 'htm', 'xhtml', 'svg', 'php', 'phtml', 'php3', 'php4', 'php5', 'phps',
    'exe', 'bat', 'cmd', 'sh', 'bash', 'js', 'cgi', 'pl', 'py', 'jar', 'vbs', 'scr', 'msi'
]);

const BLOCKED_MIME_TYPES = new Set([
    'text/html',
    'image/svg+xml',
    'application/xhtml+xml',
    'application/x-httpd-php',
    'application/x-msdownload',
    'application/x-executable',
    'application/x-sh',
    'application/x-shellscript',
    'application/javascript',
    'text/javascript'
]);

export function isBlockedFileType(filename = '', contentType = '') {
    if (contentType) {
        const normalizedMime = contentType.toLowerCase().split(';')[0].trim();
        if (BLOCKED_MIME_TYPES.has(normalizedMime)) {
            return true;
        }
    }
    if (filename) {
        const parts = filename.toLowerCase().split('.');
        if (parts.length > 1) {
            const ext = parts[parts.length - 1].trim();
            if (BLOCKED_EXTENSIONS.has(ext)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Validates an upload/proxy destination.
 *
 * Order of the gates:
 *   1. protocol must be https
 *   2. hostname must not be a private/reserved literal or a local name
 *   3. hostname must be on the S3 allowlist
 *   4. EVERY address the hostname currently resolves to must be public
 *      (this is what closes the DNS-rebinding / resolves-to-private-IP hole)
 *
 * Returns `{ ok: true, url, hostname, addresses }` on success. Callers that
 * want to pin the connection to the validated address can use
 * `createPinnedLookup(addresses)` from ./networkSafety.
 */
export async function validateUploadProxyTarget(rawTarget, { env = process.env } = {}) {
    if (typeof rawTarget !== 'string' || rawTarget.trim() === '') {
        return { ok: false, reason: 'missing_target' };
    }

    let url;
    try {
        url = new URL(rawTarget);
    } catch {
        return { ok: false, reason: 'invalid_url' };
    }

    if (url.protocol !== 'https:') {
        return { ok: false, reason: 'unsafe_protocol' };
    }

    const hostname = normalizeHostname(url.hostname);
    if (isBlockedHost(hostname)) {
        return { ok: false, reason: 'host_not_allowed' };
    }

    const allowedHosts = parseAllowedHosts(env);
    if (!isAllowedS3Host(hostname, allowedHosts)) {
        return { ok: false, reason: 'host_not_allowed' };
    }

    // Resolve + validate every address. checkDestination re-runs the hostname
    // gates, resolves A *and* AAAA records and rejects the destination if any
    // resolved address is private/loopback/link-local/CGNAT/IPv4-mapped.
    const destination = await checkDestination(url.toString());
    if (!destination.ok) {
        // A name that does not resolve is not a rebinding, it is a typo or a
        // dangling record; report it distinctly from a blocked address.
        const reason =
            destination.reason === 'invalid_url' ? 'invalid_url' : destination.reason;
        return { ok: false, reason };
    }

    return {
        ok: true,
        url: destination.url,
        hostname,
        addresses: destination.addresses,
    };
}
