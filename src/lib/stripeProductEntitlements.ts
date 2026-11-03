/**
 * Which access each Stripe product grants.
 *
 * Keyed by Stripe PRODUCT id (prod_...), so any price or payment link for the
 * same product keeps working without a config change. Products not listed
 * here (other apps such as Thumbnailsy or Smart Presentation AI, coaching,
 * etc.) grant nothing in this app.
 *
 * Extend or override without a code change through the
 * STRIPE_PRODUCT_ENTITLEMENTS env var, a JSON object of
 *   { "prod_...": ["smartvideo_go", "smartvideo_ai"] }
 * whose entries replace the defaults below for the same product.
 *
 * Reseller packages are handled separately by the reseller price mapping
 * (RESELLER_STRIPE_PRICE_* env vars).
 */
const GO_AI = ['smartvideo_go', 'smartvideo_ai'];
const VIRAL = ['smartvideo_viral'];

export const DEFAULT_PRODUCT_ENTITLEMENTS: Record<string, string[]> = {
  // SmartVideo GO AI (base app, all standard studios)
  prod_VT5XirSxEbGetx: GO_AI, // SmartVideo GO AI – Lifetime
  prod_VC2IZW5khNiQI4: GO_AI, // SmartVideo GO AI - Lifetime
  prod_UqMGFO6fCK3OvH: GO_AI, // SmartVideo GO AI - Lifetime ("GO AI Upgrade", $99 link)
  prod_VNxTDM6taMpfgv: GO_AI, // SmartVideo GO AI — Founding Personalization Partner
  prod_VC5HS3BbW6s6yQ: GO_AI, // SmartVideo GO - AI Upgrade - Lifetime - Webinar Special
  prod_VC5foyfKXSKqAY: GO_AI, // Smart Video GO - 3 Pay Option
  prod_VCcTBZRAY1W9ri: GO_AI, // Smart Video GO-AI Monthly

  // GO AI Viral Studio (paid upgrade)
  prod_VWjzo2czhu61x6: VIRAL, // SmartVideo GO AI Viral Studio — Lifetime Upgrade
  prod_VAETfUO4Od22Qc: VIRAL, // Viral Video - Smart Video AI - Smart Video GO - Lifetime ($49.99 link)
  prod_V6qCDLhnc44NYU: VIRAL, // Viral Video - Smart Video AI - Smart Video GO - Lifetime
};

const KNOWN_KEYS = new Set([
  'smartvideo_go',
  'smartvideo_ai',
  'smartvideo_viral',
  'founders',
  'apps_studio_diy',
  'apps_studio_training',
]);

export function getProductEntitlementMap(): Record<string, string[]> {
  const merged: Record<string, string[]> = { ...DEFAULT_PRODUCT_ENTITLEMENTS };
  const raw = (process.env.STRIPE_PRODUCT_ENTITLEMENTS || '').trim();
  if (!raw) return merged;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const [productId, value] of Object.entries(parsed)) {
      const keys = (Array.isArray(value) ? value : String(value).split(','))
        .map((k) => String(k).trim())
        .filter((k) => KNOWN_KEYS.has(k));
      merged[productId] = keys;
    }
  } catch {
    console.error('[stripeProductEntitlements] invalid STRIPE_PRODUCT_ENTITLEMENTS JSON');
  }
  return merged;
}

/** Access keys granted by one Stripe product id (empty when unmapped). */
export function entitlementsForProduct(productId: string | null | undefined): string[] {
  if (!productId) return [];
  return getProductEntitlementMap()[productId] || [];
}
