# Scrapling feature compatibility (source-based audit)

**What this is.** An audit of the actual source of `deangilmoreremix/Scrapling` (Python, ~16k LOC, read at commit `c5121c7`:
`parser.py`, `spiders/*`, `engines/*`) against what OpenHiggsBolt can do on its **existing** stack
(Next.js route handlers on Netlify, Cheerio, Crawlee, Playwright/Chromium, Supabase). 

**What this is not.** OpenHiggsBolt does **not** run or call the Scrapling library. Everything below marked
*Implemented* is a TypeScript reimplementation of the **technique**, inspired by Scrapling. No Python hosting, Docker,
GitHub Actions, new backend or separate scraping service was added.

## Status table

| Scrapling capability (source) | Status | Where / notes |
|---|---|---|
| Ad/tracker domain blocking (`engines/toolbelt/ad_domains.py`) | Implemented (PR #152) | `src/server/adDomains.ts` |
| Link rules: deny extensions, canonicalize (`spiders/links.py`) | Implemented (PR #152) | `pageSignals.ts` `isCrawlablePageUrl`/`canonicalizePageUrl` |
| Embedded data / JS-shell escalation | Implemented (PR #144) | `pageSignals.ts` `looksJsRendered`; enrichment calls an injected Playwright renderer |
| Context sorting + `find_similar` propagation | Implemented (PR #144) | `pageSignals.ts` |
| Sitemap discovery (`SitemapSpider`) | Implemented | `sitemapDiscovery.ts` + `businessEnrichment/sitemap.ts` (index recursion, gzip, caps, same-site) |
| robots.txt Allow/Disallow, crawl-delay, request-rate (`robotstxt.py`) | **Implemented (new)** | `businessEnrichment/robots.ts`. 4xx → allow, 5xx/network error → disallow-all, longest-match, `*`/`$` |
| AutoThrottle (latency-driven delay, Retry-After, block backoff ×2) (`throttle.py`) | **Implemented (new)** | `businessEnrichment/throttle.ts` |
| Per-domain + global concurrency (`CapacityLimiter`, `engine.py`) | **Implemented (new)** | `DomainThrottle` (+ `p-limit` batch pool in the route) |
| Retry with backoff (`engines/static.py`) | **Implemented (new)** | `businessEnrichment/retry.ts` backoff + jitter, circuit breaker |
| `find_similar` / adaptive relocation scoring (`parser.py`) | **Implemented (new)** | `businessEnrichment/similarity.ts` (`similarityScore`, `selectResilient`, `findSimilar`) |
| LinkExtractor allow/deny rules → contact-page discovery | **Implemented (new)** | `businessEnrichment/contactPages.ts` |
| `find_by_text` / `find_by_regex` / `get_all_text` | Partial | Equivalent regex/text extraction in `extract.ts`; no general-purpose selector API exposed |
| Response cache by request fingerprint (`cache.py`) | Partial | Existing in-memory `businessDiscoveryCache` for finder results; **enrichment results are not cached or persisted** |
| Checkpoint / resume (`checkpoint.py`) | Partial | Not a durable job: work is chunked (≤5 businesses per request, client sends follow-ups). The existing `discoveryJobs` background-worker path was **not** extended |
| Stealth / anti-bot browsers, fingerprint spoofing, proxy rotation (`_stealth.py`, `_browsers/*`) | **Unavailable by design** | Evading access controls conflicts with "respect website access restrictions". A site that blocks us is reported, not circumvented |
| MCP/AI server, CLI/shell, Scrapy integration, lxml/w3lib/protego | Unavailable | Python-only or out of scope; equivalents re-implemented where useful (robots) |

## Business Finder: guaranteed-30 backfill

`src/server/businessDiscovery/backfill.ts`, wired into `app/api/personalization/find-businesses/route.ts`.

* The route returns at most `limit` (default 30) businesses; previously 30 was only a cap. When the first pass leaves fewer
  than `min(limit, 30)` qualifying independents, the route widens: radius 15→25→35→50 mi, then related niches at 50 mi.
* After every stage, records are merged (website domain, phone, normalized name + address, OSM id), classified and
  filtered with the existing ownership rules (`national_bigbox` excluded unless `includeChains: true`); chain names
  followed only by a store-format word ("Walmart Supercenter", "CVS Pharmacy") are now recognised as chains.
* Stops at the target, when stages run out (`exhausted: true`), or when the Netlify request budget is nearly spent
  (`stoppedBy: "budget"`). Nothing is invented: if the area has fewer than 30 independents the response says exactly how many
  were found and how far it searched (`backfill.message`).
* Related niches are deliberately sparse (see `NICHE_SYNONYMS`); a niche without an honest neighbour is not padded with
  unrelated businesses. A live run with a wrongly-related niche (contractors → auto) surfaced car dealers, so that entry was removed.
* Opt out with `backfill: false`. Simple and Advanced callers are unchanged; the response gains an optional `backfill` object.

## Enrichment

`POST /api/personalization/enrich-business` → `src/server/businessEnrichment/*`.

* Fetches only through `fetchWithValidatedRedirects` (SSRF check and connection pinning on every hop); per-IP rate limit;
  honours robots.txt; paces per domain; at most 4 pages per site and 5 sites per request.
* Extracts emails (mailto, JSON-LD, microdata, visible text, `[at]/[dot]` obfuscation, Cloudflare `data-cfemail`), phones, postal
  address, named people (JSON-LD only — names are never guessed from text), and social profiles (share/intent links are rejected).
* Every value is `{ value, sourceUrl, confidence, method }`. Confidence reflects the method (mailto 0.95 … page-text 0.55–0.8) and
  rises slightly when several pages agree. It is a ranking heuristic, **not** a probability.
* Sites that block the crawler are reported (`notes`, `pagesSkipped`), not worked around.

## Verification (what actually ran)

* Vitest unit: backfill (15), route backfill (6), enrichment modules (29), enrich route (5).
* Real-browser integration: local HTTP fixture site, fetched over real sockets, Playwright Chromium as the JS renderer —
  static pages, JS-only contact data, gzip sitemap index, obfuscated email, robots Disallow, and the SSRF guard
  (production fetch refuses loopback). This caught a real bug (JSON-LD `Plumber` subtype not recognised).
* Live end-to-end (`LIVE_BUSINESS_FINDER=1 npx vitest run src/server/__tests__/businessFinderLive.e2e.test.ts`): real
  Nominatim discovery + backfill + enrichment of real business websites. Overpass was unreachable from the build sandbox
  (connection reset), so discovery ran on the Nominatim path. Results vary with live data.
