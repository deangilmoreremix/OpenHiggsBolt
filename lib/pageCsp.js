// Public landing pages (/p/<slug>) may load the owner's own tracking (Tag Manager, Google Analytics, Facebook and TikTok
// pixels), set on a page's sign-up form. Those hosts are allowed on /p/ only; every other route keeps the stricter policy.
const SCRIPT = 'https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com';
const CONNECT = 'https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://www.facebook.com https://connect.facebook.net https://analytics.tiktok.com https://*.tiktok.com';

/** @param {string} csp the app's policy @param {string} [pathname] */
export function withPageTracking(csp, pathname = '') {
  if (!String(pathname).startsWith('/p/')) return csp;
  return csp.split('; ').map((d) => (d.startsWith('script-src ') ? `${d} ${SCRIPT}` : d.startsWith('connect-src ') ? `${d} ${CONNECT}` : d)).join('; ');
}
