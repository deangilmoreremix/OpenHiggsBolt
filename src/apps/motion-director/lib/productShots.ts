/**
 * Shots that render a product's real pages: they read full-page captures and
 * card crops through `demosrc/_fixtures/liveTexture`, so a clip's `screens` /
 * `crops` props put the user's product on screen. Every other recipe draws its
 * own UI in code and only takes the shared title / tint overlay.
 *
 * Plain data so the server-side director can import it.
 */
export const PRODUCT_TEXTURE_SHOTS: readonly string[] = [
  'CrashImpactReal',
  'CrashZoomReal',
  'DeckDealFlyin',
  'DocumentTypewriterReveal',
  'FreezeAnnotateReal',
  'ListStackPress',
  'MultiplaneReal',
  'OutroGroupPhotoLaunch',
  'PageWaterfallWall',
  'RowEmbed',
  'SpotlightHeroCard',
  'TypeAndFilter',
  'WhipBrakeReal',
];

export const isProductTextureShot = (componentName: string): boolean =>
  PRODUCT_TEXTURE_SHOTS.includes(componentName);
