# Motion Studio design replacement (Design Agent look)

## Scope

Mid-task, the scope was narrowed to: **replace Motion Studio's whole visual design
with the Design Agent's design, and build no new features.** This report covers
that work. The items in the original brief that would have been new features are
listed under [Not built](#not-built-by-decision) and were deliberately left out.

Every Motion Studio feature that existed before still exists, with the same
handlers, store calls and engine: the entry prompt, aspect ratio / duration, media
attach, recipe picker, "Use My Brand" (Personalization), Motion Agent, Prompt
panel, History gallery, sessions, recipe library (Templates / My Motion Recipes /
Community), Remotion preview, inspector and film theme, timeline (Workbench),
undo/redo, MP4 export, JSON export/import, reset and language switch.

## Source inspected

- `src/apps/design-agent/DesignAgent.tsx`, `ErrorBoundary.tsx`, `DesignAgent.parity.test.js`
- `src/shared/styles/designTokens.ts`, `app/globals.css`
- `src/apps/motion-studio/` — `MotionStudio.tsx`, `App.tsx`, `pages/MotionStudioEntry.tsx`,
  `components/MotionAgentPanel.tsx`, `MotionRecipeCard.jsx`, `MotionPromptBar.jsx`,
  `panels/LibraryPanel.tsx`, `preview/PreviewPanel.tsx`, `store.ts`, `lib/agentCommands.ts`,
  `lib/agentApply.ts`, `lib/mediaUpload.ts`, `projectContract.ts`, `personalizationAdapter.ts`, `styles.css`
- `src/data/motionRecipeCatalog.ts` and its tests
- `src/shared/personalization/` (`PersonalizationModal.tsx`, `DemoPersonalizeProvider.tsx`,
  `guided/StepChooseVideo.tsx`, `guided/TemplateBrowser.tsx`, `image-editor/ImageEditorModal.tsx`)
- `e2e/helpers/motion-studio.ts` and the Motion Studio E2E specs

## Branch integration

Motion Studio only existed on `shotcraft-motion-library`, which was 112 commits
behind `main`. It was merged into this branch first (merge commit, no history
rewrite). Conflict decisions:

| Area | Kept | Why |
| --- | --- | --- |
| Personalization Motion Studio tab, `TemplateBrowser`, `motionTemplate` provider state, `PreviewVideoRef` `motion-template` kind | `main` | The branch removed them; the brief requires keeping them. |
| `e2e/personalization-separation.spec.ts`, `e2e/motion-studio-personalization-separation.spec.ts` | removed | They asserted the Personalization Motion Studio tab is absent, which contradicts the requirement. The second one asserted nothing. |
| `netlify.toml` build command, tracked `packages/studio/dist` | `main` | `main`'s pnpm build fix is newer. |
| `motionRecipeCatalog.ts` helpers | both | `main`'s card helpers + the branch's `resolveMotionTemplate` / `motionCardIdFor` / `motionTemplateVariants`. |
| `StandaloneShell.js` tab map | both | `main`'s `motion-control` + the branch's `motion-studio`. |

Catalog: the branch added a 151st shot, `ui-entrance/page-waterfall-wall/VerticalTicker`,
with no preview clip. It is not an upstream ShotCraft style (upstream
`page-waterfall-wall` has one style), so it broke `main`'s
"catalog == upstream library, every shot has a real clip" test and would have shown
a shot with no animated preview. It was removed from the catalog (150 shots /
124 cards). The `demo:VerticalTicker` card is still in the card registry, so saved
projects that use it still render. The two tests that counted it were updated
(`motionCatalogBridge.test.ts` 21→20 multi-variant cards — its title already said
20; `motion-studio-acceptance.spec.ts` 151→150 shots).

## What was reused / changed

### New shared presentation module

`src/apps/design-agent/ui.tsx` — pure UI, no API calls or session state, taken
out of `DesignAgent.tsx`:
`useTypingPlaceholder`, `HomeHero`, `PromptCard`, `PromptInput`, `AttachButton`,
`TemplatesPill`, `SelectedChip`, `SendButton`, `PillButton`, `NewProjectTile`,
`ProjectTile`, `ChatBubble`, `TemplatePickerModal`, `TemplateOption`.

`DesignAgent.tsx` now renders its home, composer, bubbles, tiles and template
modal from these. Its markup, copy, MuAPI sessions/jobs/approval flow and
attachments are unchanged; the existing parity test passes unmodified. Small
side effects: the template modal now has `role="dialog"`, Escape-to-close and a
labelled close button; project tiles are keyboard-focusable; the send button
carries screen-reader text.

Motion Studio does **not** import `DesignAgent` or call `/api/design-agent/*`.
It only uses the presentation module, so the two backends stay separate.

### Motion Studio home (`pages/MotionStudioEntry.tsx`)

The old four-section page (Describe / Use My Brand / Choose Motion Design) was
replaced by the Design Agent home layout:

- top row: **Brand Kit** pill (opens the same Personalization brand source as
  before) and the selected-client chip (clears it, as before)
- hero: "Films are easier with **Motion Studio**"
- the Design Agent prompt card with the typewriter placeholder; toolbar holds
  attach (+), **Templates** pill (the existing recipe picker, now in the Design
  Agent template dialog, with search and per-category sections), selected-recipe
  chip, aspect-ratio and duration pills, and the send button (labelled
  "Generate")
- Motion Studio example prompts (fill the prompt; they do not submit)
- **Recent Projects**: New Project, "Continue editing" for the current project,
  and saved sessions (open / delete — the existing store actions)

`handleCreate`, the entitlement gate, `createProjectFromEntry`, Personalization
brand mapping and media attachment are the same code as before.

### Recipe previews and English titles (follow-up)

- **Template pop-up previews (Remotion).** Each recipe in the home page's
  Templates pop-up now shows a thumbnail (`components/RecipePreview.tsx`). The
  hovered card — or the selected one when nothing is hovered — mounts a live
  Remotion `<Player>` of that recipe's own card component, the same component
  the timeline renders. Only one Player is ever mounted; the rest show the
  upstream ShotCraft poster, or a category tile where upstream has no poster.
  The still layer stays mounted under the Player (`pointer-events: none`) so the
  node under the pointer never changes — swapping it caused a spurious
  mouseleave and swallowed clicks that started on it.
- **English recipe titles.** Upstream has no English display names (its English
  name is the kebab-case key). `englishRecipeName` / `motionTemplateTitle` in
  `motionRecipeCatalog.ts` turn keys into titles
  (`crash-zoom-punch · CrashImpactReal` → `Crash Zoom Punch · Crash Impact Real`).
  Used in the pop-up, the selected-recipe chip, library cards and variant rows,
  timeline/inspector names (English locale), Motion Agent replies, and the
  Personalization recipe browser (which showed the Chinese name before). The
  upstream key stays as a small subtitle for cross-referencing the ShotCraft
  site. Search matches the English titles too.

### Motion Studio workbench (`App.tsx`, `MotionAgentPanel.tsx`, `LibraryPanel.tsx`, `MotionRecipeCard.jsx`, `styles.css`)

- Header styled as the Design Agent chat header: "← Projects" (back to the
  home), project name, then **Chat / Library / Sessions / History** mode pills.
  The pills select a view, like Design Agent's mode pills; the director panel
  now has its own × to hide it (previously a second click on the topbar button
  collapsed it).
- The director panel (existing Agent / Prompt / History tabs) moved from an
  optional right rail to a **persistent left column, open by default** — the
  Design Agent's chat-first arrangement. The Remotion preview stays in the
  centre, the inspector on the right and the timeline/Workbench at the bottom.
- Motion Agent uses Design Agent bubbles and the Design Agent prompt card. It
  still sends to the existing deterministic `interpretAgentCommand` →
  `applyAgentOps` pipeline, so every chat turn is a real store edit.
- Library tabs and category filters are Design Agent pills; recipe cards use the
  Design Agent tile look and show English names/categories. The grid is two
  columns because the panel is narrow (it was using viewport breakpoints and
  squeezed three).
- `styles.css` gained a scoped "Design Agent skin" block: flat app surface,
  hairline borders, Design Agent buttons and pills, and a stacked single-column
  layout under 900px wide so the workbench is usable on a phone.

## Screenshots

`docs/motion-studio-design-replacement/` — produced by
`e2e/motion-studio-design-replacement.spec.ts` (1440×900 and 390×844):

| | Before | After |
| --- | --- | --- |
| Home, desktop | `before-home-desktop.png` | `after-home-desktop.png` |
| Home, mobile | `before-home-mobile.png` | `after-home-mobile.png` |
| Template pop-up with live Remotion preview | — | `after-template-picker-desktop.png`, `after-template-picker-mobile.png` |
| Workbench, desktop | `before-workbench-desktop.png` | `after-workbench-desktop.png` |
| Workbench, mobile | `before-workbench-mobile.png` | `after-workbench-mobile.png` |

"Before" was captured on the merge commit, before any UI change.

## Verification

Run in this sandbox against `next dev` with a placeholder Clerk dev key (no real
Clerk calls, no production configuration touched), the dev-only
`__e2e_auth_bypass` cookie, and all paid hosts blocked by the existing helper.
`MS_OFFLINE_CLERK=1` is a new, opt-in flag in `e2e/helpers/motion-studio.ts` /
`playwright.ms.config.ts` that adds the cookies Clerk needs to skip its dev
handshake and turns off the browser proxy; nothing changes without it.

| Check | Result |
| --- | --- |
| `tsc --noEmit` | clean |
| Vitest — Motion Studio, Design Agent, Personalization, catalog (656 tests) | all pass except `DiscoveredAssets.test.tsx › imports selected person assets into identities`, which **also fails on `main`** (not touched) |
| `demoLibraryRegistry.test.ts` | failed once on a remote media fetch, passed on re-run |
| Design Agent parity test | pass, unmodified |
| E2E: design-replacement, flow, acceptance (R8-1…4), g8-wiring (G8-1…5), nav, regression, ui-verify, export-mp4 | 30 pass |
| E2E: real MP4 export from the new home → workbench | pass — 1280×720, 5.0 s, H.264 + AAC (`after-export-metadata.json`) |
| E2E: `motion-studio-preview.spec.ts` | **not run** — needs a real Clerk E2E account and a deployed target |
| Production build (`build:packages` + `next build`, placeholder Clerk/Supabase env) | pass |

## Not built (by decision)

These were in the original brief but are new features, so they were not built:

- Conversational storyboard planner (prompt → proposed scene cards → Approve /
  Revise → composition assembly). Motion Studio's existing chat edits the current
  project only.
- Design Agent popup inside Personalization (open on a person/logo/product asset,
  chat, pick a result, apply to that target). The natural place to add it later
  is next to the existing Image Editor, reusing its `handleImageEditorApply`
  path so target identity and persistence rules carry over.
- Moving catalog `preview` / `poster` out of the generated catalog file so
  re-extraction cannot clobber them (a tooling change, not a design one).

## Remaining risks

- Netlify deploy preview was not created from this session; production is
  untouched and still locked.
- No authenticated (real Clerk) browser run was possible here.
- The library panel is narrow by default (224 px); its three tabs wrap onto
  separate lines until the panel is dragged wider.
- The pre-existing `DiscoveredAssets` unit failure on `main` is unresolved.
