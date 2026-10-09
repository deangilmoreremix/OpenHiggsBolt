import dns from 'dns';
import { promisify } from 'util';

// NOTE: isBlockedFileType() is used by legacy proxy routes but not by the
// direct upload route. The direct upload route (/api/v1/upload_file) uses
// its own MIME allowlist (ALLOWED_UPLOAD_MIME_TYPES) instead of relying on
// this blocked-file check.

const resolve4 = promisify(dns.resolve4);

const DEFAULT_S3_REGION_PATTERN = /^[a-z0-9-]+$/;

const BLOCKED_IP_RANGES = [
  { start: Buffer.from('0A000000', 'hex'), end: Buffer.from('0AFFFFFF', 'hex') },       // 10.0.0.0/8
  { start: Buffer.from('AC100000', 'hex'), end: Buffer.from('AC1FFFFFF', 'hex') },      // 172.16.0.0/12
  { start: Buffer.from('C0A80000', 'hex'), end: Buffer.from('C0A8FFFF', 'hex') },       // 192.168.0.0/16
  { start: Buffer.from('A9FE0000', 'hex'), end: Buffer.from('A9FEFFFF', 'hex') },       // 169.254.0.0/16
  { start: Buffer.from('7F000000', 'hex'), end: Buffer.from('7FFFFFFF', 'hex') },       // 127.0.0.0/8
  { start: Buffer.from('00000000000000000000000000000001', 'hex'), end: Buffer.from('00000000000000000000000000000001', 'hex') }, // ::1
];

function normalizeHostname(hostname) {
    return hostname.toLowerCase().replace(/\.$/, '');
}

function parseAllowedHosts(env) {
    return (env.UPLOAD_PROXY_ALLOWED_HOSTS || '')
        .split(',')
        .map((host) => normalizeHostname(host.trim()))
        .filter(Boolean);
}

function parseIpV4(hostname) {
    const parts = hostname.split('.');
    if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) {
        return null;
    }

    const octets = parts.map((part) => Number(part));
    if (octets.some((octet) => octet < 0 || octet > 255)) {
        return null;
    }

    return octets;
}

function isIpLiteral(hostname) {
    return Boolean(parseIpV4(hostname)) || hostname.includes(':');
}

function isBlockedIpV4(hostname) {
    const octets = parseIpV4(hostname);
    if (!octets) {
        return false;
    }

    const [first, second] = octets;
    return (
        first === 0 ||
        first === 10 ||
        first === 127 ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168)
    );
}

function isBlockedHost(hostname) {
    const normalized = normalizeHostname(hostname).replace(/^\[|\]$/g, '');

    return (
        normalized === 'localhost' ||
        normalized === '::1' ||
        isIpLiteral(normalized) ||
        isBlockedIpV4(normalized)
    );
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

    // Exact S3 regional patterns:
    // bucket.s3.amazonaws.com (global endpoint)
    // bucket.s3-<region>.amazonaws.com (regional endpoint)
    // bucket.s3.<region>.amazonaws.com (dualstack endpoint)
    if (/^[a-z0-9][a-z0-9\-\.]*[a-z0-9]\.s3(-[a-z0-9][a-z0-9\-]*[a-z0-9])?(\.[a-z0-9][a-z0-9\-]*[a-z0-9])?\.amazonaws\.com$/.test(hostname)) {
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

function isBlockedIp(ip) {
  if (!ip || typeof ip !== 'string') return true;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return true;
  const buf = Buffer.from(parts);
  for (const range of BLOCKED_IP_RANGES) {
    if (buf.length === range.start.length && buf >= range.start && buf <= range.end) {
      return true;
    }
  }
  return false;
}

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

    // Resolve hostname to prevent SSRF via DNS rebinding
    try {
        const addresses = await resolve4(hostname);
        if (addresses.some(addr => isBlockedIp(addr))) {
            return { ok: false, reason: 'resolved_to_blocked_ip' };
        }
    } catch {
        return { ok: false, reason: 'dns_resolution_failed' };
    }

    return { ok: true, url: url.toString() };
}
