# Enhancement Plan: MuAPI Model & Capability Expansion Across OpenHiggsBolt Studios

**Date:** 2026-08-13
**Scope:** Audit of 17 repos (full source, not READMEs) + current `OpenHiggsBolt` architecture, then a phased plan to enhance the app and every studio.

---

## 1. Executive Summary

Every audited repo is a thin wrapper over the **same MuAPI surface your studios already use**:
`POST /api/v1/{model}` → `{request_id}`, then poll `GET /api/v1/predictions/{request_id}/result` with header `x-api-key`.

Your `packages/studio/src/models.js` is an **auto-generated catalog** (run `scripts/verify-muapi-apis.mjs`) with **~254 video + ~206 image + 14 audio + 53 text + 24 training** models already declared. That means most of these engines *may already have endpoints* — but they are missing the **curated parameter schemas, feature toggles, prompt intelligence, embedded MCP servers, the skills library, the monetization layer, and Claude Fable 5 orchestration** that these repos provide.

**The plan therefore has two tracks:**
- **Track A — Wire completeness:** refresh the catalog and overlay curated metadata so the newest 2026 engines (MiniMax H3, Wan 3.0, FLUX 3, Grok Imagine 2, Seedance 2.5, Claude Fable 5, Seedance character/watermark) are present with correct params (native audio, seed, camera_fixed, reference roles, durations up to 30s, resolutions up to 4k, webhook_url).
- **Track B — Experience layers (the real value):** prompt libraries + camera-control UX, native-audio toggle, first/last-frame + omni-reference with role tags, character-consistency (Seedance sheet) flow, embedded MCP servers, the 56-skill Generative-Media-Skills library, an in-app monetization/guidance layer, and Claude Fable 5 as the agent orchestrator.

---

## 2. Current-State Snapshot (what exists today)

| Area | Status |
|------|--------|
| MuAPI client | `packages/studio/src/muapi.js` — `submitAndPoll(endpoint,payload,key,…)`, `x-api-key`, proxy via `/api/*` |
| Model catalog | `packages/studio/src/models.js` (568 KB, auto-generated 2026-07-09). UI auto-renders controls from `inputs` schema via getters (`getAspectRatiosForVideoModel`, `getDurationsForModel`, `getResolutionsForVideoModel`, `getModesForModel`, `getMaxImagesForI2VModel`) |
| Studios | Image, Video, Audio, Cinema, Marketing, Clipping, VibeMotion, LipSync, Recast, Workflows, Agents, Design-Agent, VFX, Storyboard, Thumbnail, AI-Influencer, Social-Publishing, MCP-CLI |
| Reference images | Video (`images_list`), Cinema, Marketing (`images_list`/`video_files`), Image (`image_url`/`swap_url`) |
| Character consistency | AiInfluencerStudio (dedicated) + Recast (`character_orientation`) + reference-i2v models |
| Seed control | Only Video + LipSync expose `seed` in UI |
| Native audio | **Not surfaced** as a toggle (video models return audio but UI ignores `generate_audio`) |
| MCP | **Linked only** (McpCliStudio promo tab → hosted `api.muapi.ai/mcp`). Not embedded/run in-app |
| Skills | Design-Agent `run-skill` route exists; no generative-media skills bundled locally |
| Cost | Server-computed via `estimate-cost` / `calculate_dynamic_cost`; live balance in header. **No static price/quality table** |
| Key storage | Encrypted per-user in Supabase `app_users` (BYOK) |

**Result normalization caveat:** SDKs across repos read `outputs[0]`, `output.video`, `url`, `video_url`, `sheet_url`, `file_url` inconsistently. Your `normalizeMuapiResult` must already handle this, but add `sheet_url` (Seedance character) and `webhook_url` (push mode).

---

## 3. Audit Findings → Assets Available (condensed)

| Repo | Key assets extracted |
|------|----------------------|
| **MiniMax-H3-API** | Endpoints `minimax-h3-text-to-video`, `-image-to-video`, `-reference-to-video`; params `aspect_ratio,resolution(2k),duration(5–15),image_url,last_image_url,reference_images/videos/audios,webhook_url`; native stereo audio via `reference_audios` |
| **awesome-minimax-h3-prompts** | Validated client + **prompt block structure** (FORMAT/SUBJECT/ACTION-BEATS/CAMERA/WORLD/AUDIO/CONSTRAINTS), camera-move vocabulary (`locked-off`, `slow push-in`, `lateral track`, `gentle orbit`, `handheld follow`, `top-down to horizon`), shot-list **JSON schema** (`shots[]`: shot_id,start_time,end_time,camera_angle,subject,action,visual_details,audio_cues), `H3-Context-IR` prompt-enrichment workflow, 30 gallery prompts |
| **Wan-3.0-API** | Endpoints `wan-3.0-t2v/i2v/reference-to-video`; `seed`, `audio`(bool), `upload_file`; **MCP server** (4 tools: text_to_video, image_to_video, reference_to_video, get_task_status) |
| **Flux-3-Dev-API** | Endpoints `flux-3-dev`, `flux-3-text-to-image`, `flux-3-image-to-image`, `flux-3-text-to-video`, `flux-3-image-to-video`; **Dev/flagship split**, up to **4** reference images, `generate_audio`; MCP server (7 tools) |
| **awesome-flux-3-api-prompts** | 5/6-part prompt formula, 14 production prompts, lighting/camera vocab, param table (`resolution 1k/2k/4k`, `duration 4–10`, `generate_audio`) |
| **Grok-Imagine-Image-2-API** | Endpoint `grok-imagine-image-2`; **multi-reference up to 5** images; MCP server (4 tools) |
| **flux-3-video-api** | `flux-3-text-to-video`, `flux-3-image-to-video`; **native synchronized audio** (`generate_audio`, default true); 480p/720p/1080p; MCP server (4 tools) |
| **Seedance-2.5-API** | **72 routes** = 6 families (t2v/i2v/first-last-frame/omni-reference/video-edit/video-extend) × 3 variants (standard/intl/spicy) × 4 resolutions; `seed`, `camera_fixed`, `generate_audio`, `output_format(mp4/mov)`, `webhook_url`; **character sheet** `seedance-2-character` → `sheet_url`; watermark removers; MCP server (14 tools) |
| **awesome-seedance-2.5-api-prompts** | **Camera vocabulary table** (push in/dolly/crane up/orbit/360/whip pan/rack focus/gimbal/FPV/static/locked-off), lighting keywords, 6-step formula, 30 cinematic prompts, `@image/@video/@audio` tag convention, `ratio:"adaptive"`, `return_last_frame` |
| **seedance2.5-comfyui** | Native ComfyUI nodes (`Seedance25TextToVideo`, `ImageToVideo`, `FirstLastFrame`, `OmniReference`, `Character`, `ConsistentVideo`, `Extend`); extra request fields `quality(basic/high)`, `camera_fixed`, `output_format` confirmed accepted by MuAPI |
| **seedance-2-mcp** | MCP (4 tools) for Seedance **2**: quality standard/fast, duration ≤15s, I2V via `images_list` |
| **seedance-2.5-mcp** | MCP (6 tools) for Seedance **2.5**: `resolution` 720p/480p, duration ≤30s, `seed`, omni ≤20 img/6 vid/6 aud |
| **awesome-claude-fable-5** | **Claude Fable 5** = frontier reasoning/agent model (MuAPI 20%-off endpoint `/api/v1/claude-fable-5`); **94 use cases** (coding/agents/games/visual/marketing/docs); relay pattern "think+review with Fable 5, execute with cheaper models" |
| **ai-creator-academy** | 15-track / 64-module monetization curriculum; **pricing ladders** ($35/ad → $200/batch → $2k/mo retainer; avatar $300–$800/$1k–$3k; agency retainers), templates (`ugc-script-template`, `retainer-proposal-template`, `agency-pricing-calculator`, `api-cost-calculator`) |
| **Generative-Media-Skills** | **schema_data.json** (267 `model→endpoint` entries — authoritative registry); **56 skills** (21 motion, 6 social, 27 visual, edit, workflow); `prompt→generate→edit→stitch` pipeline; 19-tool MCP server; skill = `SKILL.md` frontmatter + scripts |
| **awesome-ai-video-models** | 35+ video models with **price/sec, speed, quality, MuAPI-aggregated flag** (Veo 3.1, Kling 3.0, Seedance 2.0/2.5, Hailuo 2.3 via MuAPI) |
| **awesome-ai-image-models** | 16+ image models with **price/image, quality, MuAPI-aggregated flag** (Nano Banana Pro, FLUX.2 pro, Seedream 4.5 via MuAPI) |

---

## 4. Gap Analysis (repos vs. current app)

| Capability | In app today? | Source repo to close gap |
|------------|---------------|--------------------------|
| Newest 2026 engines (H3, Wan 3.0, FLUX 3, Grok 2, Seedance 2.5, Fable 5) correctly wired | Partial (catalog auto-gen, may be stale) | All SDK repos |
| `generate_audio` / native synced audio toggle | ❌ | Wan, FLUX 3, Seedance, flux-3-video-api |
| First/last-frame & omni-reference with role tags (`@image/@video/@audio`) | Partial (images_list only) | Seedance 2.5, MiniMax H3 |
| Character-consistency sheet flow (`seedance-2-character` → `sheet_url`) | ❌ (AiInfluencer is separate) | Seedance-2.5-API, seedance2.5-comfyui |
| `camera_fixed` + camera-movement chips | ❌ | awesome-seedance-2.5-api-prompts, H3 prompts |
| `seed` exposed on all video/image models | Only Video + LipSync | Wan, Seedance 2.5 |
| `webhook_url` push mode (vs long-poll) | ❌ | MiniMax H3, Seedance 2.5 |
| Multi-reference editing UI (4 FLUX / 5 Grok) | Limited | Flux-3-Dev-API, Grok-Imagine |
| Dev/flagship model toggle | ❌ | Flux-3-Dev-API |
| Prompt libraries + formulas + camera vocab in-studio | ❌ | H3 prompts, FLUX prompts, Seedance prompts |
| Structured shot-list editor | ❌ | awesome-minimax-h3-prompts |
| Embedded MCP servers (run in-app) | Linked only | Wan, Grok, Flux, Seedance 2/2.5 MCPs |
| Skills library (56 recipes) | ❌ (Design-Agent only) | Generative-Media-Skills |
| Monetization/guidance wizards | ❌ | ai-creator-academy |
| Model picker price/speed/quality filters | ❌ (server estimate only) | awesome-ai-video/image-models, schema_data.json |
| Agent orchestrator (Fable 5 relay) | Agents studio generic | awesome-claude-fable-5 |

---

## 5. Enhancement Roadmap (phased, prioritized)

### Phase 0 — Foundation: Catalog refresh + canonical registry (1–2 days)
**Goal:** Single source of truth for every model, param, and price.
- **P0.1** Re-run `scripts/verify-muapi-apis.mjs --emit` to refresh `models.js` from live MuAPI (captures the newest engines).
- **P0.2** Import `Generative-Media-Skills/schema_data.json` (267 entries) as the **authoritative `model → endpoint → category` registry**; diff against `models.js` and backfill any missing engine (MiniMax H3, Wan 3.0, FLUX 3, Grok Imagine 2, Seedance 2.5, Claude Fable 5, Seedance character/watermark-remover).
- **P0.3** Add a **curated metadata overlay** (`models.overrides.json`) keyed by endpoint, carrying: `supportsAudio`, `supportsFirstLastFrame`, `supportsOmniReference`, `maxReferenceImages`, `supportsSeed`, `supportsCameraFixed`, `supportsWebhook`, `variantStrategy` (standard/intl/spicy), `priceTier` (from awesome lists), `muapiAggregated` flag. The UI getters read catalog ∪ overlay.
- **P0.4** Harden `normalizeMuapiResult` to also extract `sheet_url` and accept `webhook_url` completion (stop polling on webhook).
- **DoD:** Every 2026 engine resolvable; price/muapi flags present in picker.

### Phase 1 — Video & Cinema studios: native audio, references, camera, character (1–2 weeks)
**Adds the highest-visible value to Video / Cinema / Marketing / Clipping.**
- **P1.1 Native-audio toggle:** surface `generate_audio` (Wan/FLUX 3/Seedance) and `audio` (Wan reference) as a first-class control; default per overlay.
- **P1.2 First/Last frame:** I2V model picker gains `last_image_url` (MiniMax H3) / Seedance `first-last-frame` (exactly 2 images) branch.
- **P1.3 Omni-reference + role tags:** ordered reference list UI emitting `images_list`/`videos_list`/`audios_list`; inject `@image1/@video1/@audio1` label chips into the prompt text (Seedance convention).
- **P1.4 Camera-control UX:** clickable **camera-movement chip set** (`slow push-in`, `dolly`, `crane up`, `orbit/360`, `whip pan`, `rack focus`, `gimbal`, `FPV`, `static/locked-off`) that append keywords to the prompt; a **"lock camera"** toggle → `camera_fixed=true` (Seedance).
- **P1.5 Character-consistency (Seedance) flow:** new "Consistent Character" mode → `POST seedance-2-character` (1–3 photos + outfit prompt) → capture `sheet_url` → auto-prepend to `omni-reference` `images_list` for every subsequent shot. Reuse for AI-Influencer studio.
- **P1.6 Seed & resolution expansion:** expose `seed` on all video + image models; allow 480p→4k and 4s→30s durations per overlay caps.
- **P1.7 Video-Edit / Video-Extend / Watermark-remover:** add as Cinema/Marketing sub-modes (Seedance 2.5 + legacy v2.0 extend).
- **DoD:** A user can generate H3/Wan/FLUX3/Seedance 2.5 video with audio, references, camera lock, and a consistent character, entirely in-app.

### Phase 2 — Image & Audio studios: multi-reference, Dev/flagship, synced audio (1 week)
- **P2.1 Multi-reference editing UI:** ordered reference list (≤4 FLUX, ≤5 Grok) for Image Studio i2i; prompt references refs "in order".
- **P2.2 Dev/flagship toggle:** `flux-3-dev` (1k, cheap) vs `flux-3-text-to-image` (2k) split in model picker.
- **P2.3 Grok Imagine 2:** add `grok-imagine-image-2` t2i + multi-ref edit.
- **P2.4 Audio studio ↔ video audio:** when a video model returns audio, offer "open in Audio Studio / download stems"; expose `create_music`/`lipsync` already present; add MMAudio/sync-lipsync picks from schema_data.
- **DoD:** Image Studio supports 4–5 reference edits + Dev toggle; Audio reflects video-native audio.

### Phase 3 — Prompt Intelligence layer (1 week)
- **P3.1 Prompt library:** seed DB/JSON with H3 block structure, FLUX 5/6-part formula, Seedance 30 prompts, FLUX 14 prompts, H3 30 gallery prompts. Browseable per studio, one-click insert.
- **P3.2 Shot-list editor:** structured `shots[]` JSON (shot_id,start_time,end_time,camera_angle,subject,action,visual_details,audio_cues) → serializes to a long prompt for H3/FLUX.
- **P3.3 Prompt enhancer:** wire existing Supabase `enhance-prompt` + H3-Context-IR (`reference_to_video` enrichment workflow) "Improve my prompt" button in every studio.
- **P3.4 Camera/lighting vocab autocomplete** across video studios.
- **DoD:** Prompt templates + enhancer + shot-list editor live in Image/Video/Cinema.

### Phase 4 — Embedded MCP servers + Skills library (1–2 weeks)
- **P4.1 In-app MCP client:** replace the McpCliStudio *promo* tab with a real MCP launcher that connects to the hosted `api.muapi.ai/mcp` and/or runs the cloned **Wan / Grok / Flux / Seedance 2 / Seedance 2.5 MCP servers** (already written in the audited repos) so the **Agents** and **Workflows** studios can call them as tools.
- **P4.2 Skills as studio recipes:** bundle `Generative-Media-Skills` (56 skills) into the app (mirror how Design-Agent `run-skill` works). Each skill becomes a one-click "recipe" in the relevant studio (e.g., `ugc-ads-workflow` → Marketing, `youtube-shorts`/`ai-clipping` → Clipping, `cinema-director` → Cinema, `nano-banana`/`logo-creator` → Image, `seedance-2` → Video). Reuse the `prompt→generate→edit→stitch` pipeline pattern.
- **P4.3 Workflow templates:** convert the 94 Fable 5 use cases + skill recipes into importable Workflow templates.
- **DoD:** Agents/Workflows can invoke MCP tools + skills; recipes browsable in studios.

### Phase 5 — Orchestration (Claude Fable 5) + Monetization layer (1–2 weeks)
- **P5.1 Fable 5 orchestrator:** add `claude-fable-5` to the Agents studio as the "planner/reviewer" brain using the relay pattern (think/review with Fable 5, execute with cheaper models). MuAPI 20%-off endpoint.
- **P5.2 Monetization wizards:** lift `ai-creator-academy` templates into guided wizards per studio — UGC pricing ladder + `retainer-proposal-template` (Marketing), avatar tiers (AI-Influencer), agency `pricing-calculator` + `freelance-client-contract` (Agents/Workflows), `api-cost-calculator` (header/Settings).
- **P5.3 Model picker enrichment:** surface `awesome-ai-video/image-models` price/sec + speed + quality + "MuAPI-aggregated" badge as filters/sort in the model picker (static cache refreshed from the lists' markdown tables).
- **DoD:** Studios output both media **and** a priced client deliverable; Fable 5 drives agent workflows.

### Phase 6 — Ops & polish
- **P6.1** `GET /api/v1/account/balance` already in header — add per-generation cost stamp using `estimate-cost`.
- **P6.2** ComfyUI nodes (`seedance2.5-comfyui`) → optional "Export to ComfyUI" for power users.
- **P6.3** Docs: publish a model-capability matrix + studio↔model map in `docs/`.

---

## 6. Repo-Asset → Studio/Feature → Priority Map

| Repo asset | Target studio/feature | Phase | Priority |
|------------|----------------------|-------|----------|
| MiniMax H3 endpoints + webhook + reference_audios | Video/Cinema | P0/P1 | High |
| H3 prompt block + camera vocab + shot-list JSON | Prompt layer + Video/Cinema | P3 | High |
| Wan 3.0 `seed`/`audio` + MCP | Video + MCP (P4) | P1/P4 | High |
| FLUX 3 Dev/flagship + 4-ref + `generate_audio` + MCP | Image/Video + MCP | P1/P2/P4 | High |
| FLUX 3 prompts (14) + formula | Prompt layer | P3 | Med |
| Grok Imagine 2 (5-ref) + MCP | Image + MCP | P2/P4 | Med |
| flux-3-video-api native audio + MCP | Video + MCP | P1/P4 | High |
| Seedance 2.5 72 routes + character sheet + camera_fixed | Video/Cinema/Marketing/AI-Influencer | P1 | High |
| Seedance prompts (30) + camera/lighting vocab + @tags | Prompt layer + Video | P3 | High |
| seedance2.5-comfyui nodes | Export-to-ComfyUI (P6) | P6 | Low |
| seedance-2 / 2.5 MCP | MCP launcher (P4) | P4 | Med |
| awesome-claude-fable-5 (94 cases, 20%-off) | Agents orchestrator + Workflow templates | P5 | High |
| ai-creator-academy (pricing ladders) | Monetization wizards | P5 | Med |
| Generative-Media-Skills (56 skills, schema_data) | Skills recipes + catalog registry | P0/P4 | High |
| awesome-ai-video/image-models (price/speed) | Model picker filters | P5 | Med |

---

## 7. Technical Implementation Notes

**Adding a model (catalog already auto-generates, but overlay curated metadata):**
```js
// models.overrides.json
{ "seedance-2.5-omni-reference-1080p": {
    "supportsAudio": true, "supportsOmniReference": true,
    "maxReferenceImages": 20, "maxReferenceVideos": 6, "maxReferenceAudios": 6,
    "supportsSeed": true, "supportsCameraFixed": true,
    "variantStrategy": "resolution", "priceTier": "low", "muapiAggregated": true } }
```
UI getters merge `models.js` `inputs` with overlay flags.

**Native audio toggle (Video studio):**
```js
if (modelInfo.overlay?.supportsAudio) payload.generate_audio = audioEnabled; // Wan/FLUX3/Seedance
```
**Character-consistency flow (Seedance):**
```js
const sheet = await submitAndPoll('seedance-2-character', { images_list, prompt: outfit });
const sheetUrl = normalizeMuapiResult(sheet).sheet_url; // prepend to omni images_list
```
**Embedded MCP:** reuse audited `mcp_server.py` files (FastMCP) — host them server-side (Next route / Supabase edge) or connect to `api.muapi.ai/mcp`; expose tools to Agents/Workflows via the existing `run-skill`/agent-chat proxy pattern.
**Skills bundle:** copy `Generative-Media-Skills/library/*` into `packages/studio/src/skills/`; render each `SKILL.md` as a recipe card; execute via the `prompt→generate→edit→stitch` pipeline already implicit in `muapi.js`.

---

## 8. Assumptions & Risks
- **A1:** `scripts/verify-muapi-apis.mjs` still points at a live MuAPI that returns the newest engines. If stale, P0.2 backfill is mandatory.
- **A2:** Some endpoints in the repos are "Preview/upcoming" on MuAPI (e.g., Grok Imagine 2, Seedance 2.5 4k). Gate behind feature flags; confirm against live playground before GA.
- **A3:** MCP servers are Python (FastMCP). Running them in-app requires a server-side Python host or proxying to MuAPI's hosted `/mcp`. Simplest path: connect the Agents/Workflows studios to `api.muapi.ai/mcp` and treat the cloned servers as reference specs.
- **R1:** `normalizeMuapiResult` divergence across models — centralize field extraction (incl. `sheet_url`).
- **R2:** Over-promising price tiers from awesome lists — treat as cache, refresh periodically, don't block generation on it.
- **R3:** Scope — Phase 4–5 are large; sequence after P0–P3 prove value.

---

## 9. Definition of Done (summary)
- [ ] P0: Catalog refreshed + schema_data registry + overlay; all 2026 engines resolvable.
- [ ] P1: Video/Cinema support native audio, first/last frame, omni-reference + role tags, camera chips + lock, Seedance character sheet, 30s/4k, edit/extend/watermark.
- [ ] P2: Image multi-ref (4–5), Dev/flagship toggle, Grok 2, audio↔video linkage.
- [ ] P3: Prompt library + shot-list editor + enhancer + camera/lighting autocomplete.
- [ ] P4: In-app MCP launcher + 56 skills as recipes + workflow templates.
- [ ] P5: Fable 5 orchestrator + monetization wizards + model-picker price/speed filters.
- [ ] P6: Per-gen cost stamp, ComfyUI export, published capability matrix doc.
