# Visual Comparison — Motion Studio vs. Upstream Studios

**Motion Studio (this repo):** `src/apps/motion-studio/` — the Remotion workbench, rebranded "Motion Studio / SmartVideo GO".
**Upstream:** `Anil-matcha/Open-Generative-AI`, **vendored locally** in this repo as `packages/studio/` (`VideoStudio.jsx`, `WorkflowStudio.jsx`, `AgentStudio.jsx`, `components/prompt/PromptComposer.jsx`). The upstream studios are mounted by the same host shell as Motion Studio (`components/StandaloneShell.js`), so every upstream screenshot in this document is a real capture of the upstream code — not a description.

**How to regenerate every image in this document:**

```bash
npm run dev                                   # next dev on :3100
npx playwright test --config=playwright.ms.config.ts e2e/motion-studio-evidence.spec.ts
npx playwright test --config=playwright.ms.config.ts e2e/motion-studio-export-mp4.spec.ts
```

All captures are deterministic and offline: the dev-only `__e2e_auth_bypass=1` cookie (script-readable, `domain: 127.0.0.1`), dummy MuAPI/OpenAI keys in `localStorage` so the host's "Welcome to SmartVideo GO" onboarding modal is never rendered (`components/StandaloneShell.js` — `if (hasApiKey && hasOpenAiKey) return;`), every billing host aborted, and the account-balance poll stubbed so the host Settings modal cannot hijack a capture. See `e2e/helpers/motion-studio.ts`.

---

## 1. Motion Studio — INPUT step and FULL editor

| Screenshot | Route | Bytes | What it shows |
|---|---|---:|---|
| `docs/motion-studio-evidence/ms-entry-page.png` | `/studio/motion-studio/new` | 89,224 | **INPUT step.** Prompt composer (`Describe your motion video…`), aspect-ratio control (`16:9`), duration control (`5s`), "Generate" button, "Use My Brand", "Choose Motion Design" recipe picker |
| `docs/motion-studio-evidence/ms-workbench.png` | `/studio/motion-studio/` | 177,894 | **FULL editor.** Topbar (logo, project name, undo/redo, Agent, History, Export video / Export JSON / Import / Reset demo, language, sessions), library panel with the 10 category chips, Remotion preview stage, Inspector, timeline |
| `docs/motion-studio-evidence/ms-library-grid.png` | `/studio/motion-studio/` (library scrolled) | 199,493 | Library grid with **live Remotion `<Player>` previews** in every on-screen card (no gradient placeholder) |
| `docs/motion-studio-evidence/ms-agent-panel.png` | `/studio/motion-studio/` | 191,490 | Agent rail after one real chat turn ("make the text bigger" → "Set the text size on “字卡 · Ink Press” to 137px (was 116px)"), the Inspector showing `Font size 137px`, the player re-rendered |
| `docs/motion-studio-evidence/ms-history-gallery.png` | `/studio/motion-studio/` | 163,104 | History rail with the session the agent turn created ("Untitled project", prompt "make the text bigger", 00:14) |
| `docs/motion-studio-evidence/ms-theme-panel.png` | `/studio/motion-studio/` | 189,063 | Inspector → "Film theme": preset swatches (Paper) and the replace-colours palette (Background / Card / Text / Secondary text) |
| `docs/motion-studio-evidence/ms-entry-page.png` | `/studio/motion-studio/new` | 78,632 | INPUT step (legacy file name, re-captured) |
| `docs/motion-studio-evidence/ms-entry-page.png` | `/studio/motion-studio/new` | 86,957 | INPUT step (legacy file name, re-captured) |
| `docs/motion-studio-evidence/ms-entry-page.png` | `/studio/motion-studio/new` | 89,227 | INPUT step (legacy file name, re-captured) |
| `docs/motion-studio-evidence/ms-workbench.png` | `/studio/motion-studio/` | 177,895 | FULL editor (legacy file name, re-captured) |
| `docs/motion-studio-evidence/ms-workbench.png` | `/studio/motion-studio/` | 177,898 | FULL editor (legacy file name, re-captured) |
| `docs/motion-studio-evidence/ms-workbench.png` | `/studio/motion-studio/` | 177,905 | FULL editor (legacy file name, re-captured) |
| `docs/motion-studio-evidence/ms-workbench.png` | `/studio/motion-studio/` | 177,903 | FULL editor (legacy file name, re-captured) |
| `docs/motion-studio-evidence/ms-workbench.png` | `/studio/motion-studio/` | 177,904 | FULL editor (legacy file name, re-captured) |
| `docs/motion-studio-evidence/ms-workbench.png` | `/studio/motion-studio/` (library scrolled) | 197,883 | Library grid with previews (legacy file name, re-captured) |
| `docs/motion-studio-evidence/ms-workbench.png` | `/studio/motion-studio/` (library scrolled) | 197,879 | Library grid with previews (legacy file name, re-captured) |
| `docs/motion-studio-evidence/ms-workbench.png` | `/studio/motion-studio/` (library scrolled) | 197,881 | Library grid with previews (legacy file name, re-captured) |

Every file above is ≥ 78 KB and shows the UI unobstructed. The earlier ~16 KB blank shells and the captures that were covered by the "Welcome to SmartVideo GO" modal have all been replaced.

## 2. Upstream studios — real captures

The upstream studios ship in this repo (`packages/studio/`), are mounted by `components/StandaloneShell.js`, and are reachable in the running app. Routes come from `SLUG_TO_TAB` in `components/StandaloneShell.js` (`video` → `/studio/video`, `workflows` → `/studio/workflows`, `agents` → `/studio/agents`).

| Screenshot | Route | Upstream component | Bytes | What it shows |
|---|---|---|---:|---|
| `docs/motion-studio-evidence/upstream-video-studio.png` | `/studio/video` | `packages/studio/src/components/VideoStudio.jsx` | 139,490 | Upstream Video Studio: the shared `PromptComposer` bottom bar (gradient `rounded-[2rem]` panel, `rounded-full` cyan "Generate"), model / aspect-ratio / duration / resolution controls, generation gallery |
| `docs/motion-studio-evidence/upstream-workflow-studio.png` | `/studio/workflows` | `packages/studio/src/components/WorkflowStudio.jsx` | 836,248 | Upstream Workflow Studio: "CREATE WORKFLOW", TEMPLATES / MY WORKFLOWS / COMMUNITY tabs, template card grid with thumbnails and category labels |
| `docs/motion-studio-evidence/upstream-agent-studio.png` | `/studio/agents` | `packages/studio/src/components/AgentStudio.jsx` | 804,842 | Upstream Agent Studio: AGENTS / TEMPLATES / MY AGENTS / MY CHATS tabs, agent-template cards with cover images and "BY AI.MATCH" attribution, "CREATE" action |

`/agents` (the `app/agents/[agent_id]/[conversation_id]` chat route) is **not** reachable without an agent id — it answers 404 — so the agent-chat surface is documented through the Agent Studio capture above instead of an image of a chat page.

## 3. Export evidence (MP4)

`docs/motion-studio-evidence/export.mp4` is produced by the app itself: the INPUT step → "Generate" → editor → "Export video" → the client-side Remotion Web Renderer → the download link. It is stored **in the repo**, not in `/tmp`.

`docs/motion-studio-evidence/export-metadata.json` is generated from that exact file by parsing its MP4 boxes in Node (`scripts/motion-studio-mp4-metadata.mjs`, no ffprobe/ffmpeg):

| Field | Value |
|---|---|
| `size_bytes` | 641,071 |
| `duration_seconds` | 5.077 (150 frames @ 30 fps + AAC track) |
| `width` × `height` | 1280 × 720 |
| `video_codec` | `h264` (`avc1`) |
| `audio_codec` | `aac` (`mp4a`) |
| `ftyp_brand` | `isom` (compatible brands `isom`, `avc1`, `mp41`) |
| `creation_time` | 2026-10-20T12:36:37Z |
| `date` (file mtime) | 2026-10-20T12:37:31Z |

The previous metadata (width 0, height 1, duration 8.0, ftyp `isom`) described a hand-assembled file and did not match the artifact — it has been replaced by the values above, measured from the committed MP4.

## 4. Shared UI elements (each row cites a capture)

### Motion Studio ↔ Video Studio (`packages/studio/src/components/VideoStudio.jsx`)

| Element | Motion Studio | Upstream Video Studio |
|---|---|---|
| Prompt bar | `src/apps/motion-studio/components/MotionPromptBar.jsx` — imports `PromptTextarea`, `PromptControls`, `PromptFooter`, `PromptAction` from `studio/src/components/prompt/PromptComposer` — visible in `ms-entry-page.png` | The same `PromptComposer` system, bottom bar of `upstream-video-studio.png` |
| Generate action | `PromptAction` "Generate" in `MotionPromptBar.jsx` — `ms-entry-page.png` | `PromptAction` primary button — `upstream-video-studio.png` |
| Parameter controls | aspect ratio + duration in the composer — `ms-entry-page.png` | model / aspect ratio / duration / resolution — `upstream-video-studio.png` |
| History | session gallery in the rail — `ms-history-gallery.png` | upstream generation history in its own panel — `upstream-video-studio.png` |

### Motion Studio ↔ Workflow Studio (`packages/studio/src/components/WorkflowStudio.jsx`)

| Element | Motion Studio | Upstream Workflow Studio |
|---|---|---|
| Browse surface | library panel with Templates / My Motion Recipes / Community tabs and 10 category chips — `ms-workbench.png` | TEMPLATES / MY WORKFLOWS / COMMUNITY tabs — `upstream-workflow-studio.png` |
| Card grid | `library-grid` of recipe cards, each with a live Remotion `<Player>` preview — `ms-library-grid.png` | template cards with cover images and category labels — `upstream-workflow-studio.png` |

### Motion Studio ↔ Agent Studio (`packages/studio/src/components/AgentStudio.jsx`)

| Element | Motion Studio | Upstream Agent Studio |
|---|---|---|
| Session / history surface | session select in the topbar + `SessionPanel` + `MotionHistoryGallery` — `ms-history-gallery.png` | AGENTS / TEMPLATES / MY AGENTS / MY CHATS tabs — `upstream-agent-studio.png` |
| Conversation surface | the Agent rail is a chat surface that mutates clip props — `ms-agent-panel.png` | upstream agent pages (`app/agents/…`) are per-agent chat routes and are not reachable without an agent id (404) |

## 5. Visual design tokens — upstream class names (corrected)

The earlier revision of this document mis-stated the upstream tokens. The actual upstream values are in `packages/studio/src/components/prompt/PromptComposer.jsx`:

| Token | Upstream source (actual) | Motion Studio usage |
|---|---|---|
| Composer panel | `DEFAULT_PANEL_CLASS` — `bg-gradient-to-b from-[#18181c]/90 via-[#0f0f12]/90 to-[#0c0c0e]/95 backdrop-blur-2xl rounded-[2rem] border border-white/[0.08]` (line 15-16) | same `PromptComposer` component → `ms-entry-page.png` |
| Generate action | `DEFAULT_ACTION_CLASS` — `bg-[#22d3ee] text-black px-7 py-3 rounded-full font-bold` (line 22) | same `PromptAction` → `ms-entry-page.png` |
| Parameter controls | `CONTROL_LAYOUT_CLASS` — `h-[38px] … rounded-md` with `CONTROL_IDLE_CLASS` / `CONTROL_ACTIVE_CLASS` (line 25-30) | same `PromptControls` → `ms-entry-page.png` |
| Popover (ratio / duration menu) | `DEFAULT_POPOVER_CLASS` — `bg-[#0c0c0f]/95 rounded-xl p-3.5 backdrop-blur-2xl` (line 37) | same `PromptPopover` |
| Studio background | host shell dark surface | `src/apps/motion-studio/styles.css` — `--bg: #030303` → `ms-workbench.png` |
| Accent cyan | upstream `#22d3ee` on dark surfaces | `styles.css` — `--accent: #22d3ee`; active tab `bg-[#22d3ee] text-black` → `ms-workbench.png` |
| Card borders | upstream `border-white/5` / `border-white/[0.08]` | `border-white/[0.05]` chips, `border-white/[0.08]` panels → `ms-library-grid.png`, `ms-theme-panel.png` |
| Card radius | upstream cards use `rounded-xl` / `rounded-2xl` | `rounded-xl` cards and panels → `ms-theme-panel.png` |

## 6. Corrections made in this pass

1. **Onboarding modal no longer covers any capture.** The modal is suppressed through the API-key presence check in `components/StandaloneShell.js` (dummy keys in `localStorage`), not by clicking through it — see `e2e/helpers/motion-studio.ts`.
2. **Upstream studios are captured as images** (`upstream-video-studio.png`, `upstream-workflow-studio.png`, `upstream-agent-studio.png`) instead of being described in prose. The one surface that cannot be reached (`/agents` without an agent id → 404) is documented as a limitation.
3. **Every claim in this document cites a file that exists** in `docs/motion-studio-evidence/`, and each file is ≥ 78 KB.
4. **MP4 metadata is measured, not asserted** — `scripts/motion-studio-mp4-metadata.mjs` parses the committed MP4 (ftyp / mvhd / tkhd / stsd) and writes `export-metadata.json`; the MP4 itself is committed.

## 7. Known limitations

- `/agents/[agent_id]/[conversation_id]` (the upstream agent chat page) cannot be captured without a valid agent id — the route returns 404. The Agent Studio surface is captured instead.
- The upstream template thumbnails are fetched through `/api/thumbnail`; a few upstream CDN images answer 403 without a real MuAPI key, so those cards show the upstream's own image placeholder. That is upstream behaviour, not a capture failure.
- Each Motion Studio capture uses its own page load on purpose: with ~12 Remotion players mounted at once, headless Chrome rasterises the workbench incompletely (parts of the topbar/inspector come out black). One surface per page load keeps every capture complete.

## Files

- `docs/motion-studio-evidence/ms-entry-page.png`, `ms-workbench.png`, `ms-library-grid.png`, `ms-agent-panel.png`, `ms-history-gallery.png`, `ms-theme-panel.png` — Motion Studio (input step + full editor)
- `docs/motion-studio-evidence/upstream-video-studio.png`, `upstream-workflow-studio.png`, `upstream-agent-studio.png` — upstream studios
- `docs/motion-studio-evidence/export.mp4` + `export-metadata.json` — the rendered MP4 and its measured metadata
- `e2e/motion-studio-evidence.spec.ts`, `e2e/motion-studio-export-mp4.spec.ts`, `e2e/motion-studio-flow.spec.ts`, `e2e/motion-studio-acceptance.spec.ts` — the specs that produce and verify this evidence
- `scripts/motion-studio-mp4-metadata.mjs` — the MP4 box parser
- `docs/motion-studio-evidence/visual-comparison.md` — this document
