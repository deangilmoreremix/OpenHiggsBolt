import type { CardDef } from "./types";
import { textBasicCard } from "./text-basic";
import { titleCardCard } from "./inkpress/title-card";
import { captionStripCard } from "./inkpress/caption-strip";
import { flashCutCard } from "./inkpress/flash-cut";
import { seamBarnCard, seamDipCard, seamInkCard, seamLeakCard, seamWhipCard, seamWipeCard } from "./inkpress/seam-cuts";
import { audioClipCard, imageClipCard, videoClipCard } from "./media-cards";
import { siteInsetCard } from "./site-inset";
import { BRAND_SCENE_CARDS } from "./brand-scenes";
import { BG_CARDS } from "./background-cards";
import { DEMO_CARDS } from "./demoCards";
import { PROJECT_CARDS } from "./projectCards";
import { buildCardRegistry } from "./buildRegistry";

/** Card registry — first id wins:
 *  - native Motion Studio cards: text / Ink Press title card / caption strip / white-flash cut
 *  - media cards: audio / video / image (project public/ and the SFX library use them)
 *  - background cards
 *  - film-project unit cards from a linked workbench.ts manifest (only when one is linked)
 *  - motion library: the 151 registered demo components in demosrc/ (157 .tsx files:
 *    151 shots + the 6 shared `_fixtures/` helpers; static index from scripts/gen-motion-studio-index.mjs)
 *  Upstream also registered 66 retired demo ids for backwards compatibility with
 *  old project saves. Motion Studio is a fresh product, so there are no such saves
 *  to keep readable and the legacy layer was not ported. */
const ALL: CardDef[] = [
  textBasicCard,
  titleCardCard,
  captionStripCard,
  flashCutCard,
  seamWipeCard,
  seamBarnCard,
  seamDipCard,
  seamWhipCard,
  seamInkCard,
  seamLeakCard,
  audioClipCard,
  videoClipCard,
  imageClipCard,
  siteInsetCard,
  ...BRAND_SCENE_CARDS,
  ...BG_CARDS,
  ...PROJECT_CARDS,
  ...DEMO_CARDS,
];

const registry = buildCardRegistry(ALL);
export const CARD_LIST: CardDef[] = registry.cardList;
export const CARDS: Record<string, CardDef> = registry.cards;
