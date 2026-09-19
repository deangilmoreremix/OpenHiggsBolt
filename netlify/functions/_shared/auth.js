const DEFAULT_ALLOWED_ORIGIN = 'http://localhost:3000';

function resolveOrigin(event) {
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, '');
  const headerOrigin =
    (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  if (headerOrigin) return String(headerOrigin).replace(/\/$/, '');
  return DEFAULT_ALLOWED_ORIGIN;
}

function buildCorsHeaders(event) {
  const origin = resolveOrigin(event);
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

async function getCorsResponse(status, event) {
  return { statusCode: status || 204, headers: buildCorsHeaders(event), body: '' };
}

async function verifyClerkSession(event) {
  const authHeader =
    (event.headers &&
      (event.headers.Authorization || event.headers.authorization)) ||
    '';
  const bearer = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  const cookieToken =
    (event.cookies && event.cookies.get && event.cookies.get('__session')) ||
    null;
  const sessionToken = bearer || cookieToken;

  if (!sessionToken) {
    return null;
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  try {
    const response = await fetch('https://api.clerk.com/v1/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.id || null;
  } catch (err) {
    return null;
  }
}

async function requireClerkAuth(event) {
  const userId = await verifyClerkSession(event);
  if (!userId) {
    return {
      ok: false,
      response: {
        statusCode: 401,
        headers: buildCorsHeaders(event),
        body: JSON.stringify({ error: 'Unauthorized' }),
      },
      userId: null,
    };
  }

  return { ok: true, response: null, userId };
}

module.exports = {
  buildCorsHeaders,
  getCorsResponse,
  requireClerkAuth,
  verifyClerkSession,
};
