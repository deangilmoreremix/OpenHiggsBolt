# Motion Director — ported-code notice & attribution

Motion Director (`src/apps/motion-director/`) is built on the **ShotCraft
Workbench** and the shot-card motion library from
[`video-shotcraft`](https://github.com/Vincentwei1021/video-shotcraft)
(author: Wei Yihao), which is licensed under the **Apache License 2.0**.

```
Copyright 2026 Wei Yihao

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## What changed in this port

- **Rebranded.** All customer-facing branding was replaced: the product is
  shipped as **Motion Director**, part of **SmartVideo GO** (`src/apps/motion-director/demosrc/_fixtures/Brand.tsx`,
  `src/apps/motion-director/i18n.ts`, `src/apps/motion-director/App.tsx`).
- **Re-themed.** The ported stylesheet consumes the existing OpenHiggsBolt design
  tokens (`app/globals.css`, `src/shared/styles/designTokens.ts`) instead of the
  original Apple-dark palette.
- **Integrated.** The app was moved from a standalone Vite entry
  (`workbench/src/main.tsx`) into the Next.js App Router as
  `src/apps/motion-director/MotionStudio.tsx`, routed from
  `components/StandaloneShell.js` under `/studio/motion-studio`.
- **Renderer runs in the browser.** Upstream's dev-server `/api/export`
  middleware spawns `remotion render` (jpeg frames, ANGLE GL). Motion Director
  has no server render route: the MP4 is rendered in the user's tab with
  `@remotion/web-renderer` (`webRenderer.ts`, started from `ExportButton.tsx`
  and the film result card), so pixels are not byte-identical to the CLI's.
  The server side of this studio is only `app/api/motion-studio/capture`,
  `capture/status` and `director` (the name is historical). `Remotion` and the
  `@remotion/*` packages are Apache-2.0 by Remotion GmbH.

## Internally kept for compatibility

These identifiers are **not** branding: renaming them would discard existing
saved projects and palettes and break the palette import/export format, so they
are deliberately retained (each has an inline comment at its declaration).

| Identifier | Location | Why it must not change |
|---|---|---|
| `shotcraft-workbench-project-v1` | `src/apps/motion-director/store.ts` | localStorage key holding the saved project |
| `shotcraft-workbench-locale` | `src/apps/motion-director/i18n.ts` | localStorage key holding the UI language |
| `shotcraft:palettes:*` | `src/apps/motion-director/panels/ThemePanel.tsx` | localStorage prefix holding saved palettes |
| `shotcraft-palette` (format id) | `src/apps/motion-director/palettePresets.ts` | `.palette.json` interchange format |
| card ids (`demo:*`, `inkpress-*`, `text-basic`, `bg-*`, `video-clip`, `image-clip`, `audio-clip`, `proj:*`) | `src/apps/motion-director/cards/*` | referenced by saved projects |

## Audio assets

`public/motion-studio/sfxlib/**` and `public/motion-studio/bgmlib/**` come from
the upstream repository's `assets/audio/`; its `ATTRIBUTION.md` is the source of
truth for the per-file licences and the upstream attribution requirements.

## video-talkcraft (vendored, not wired into the app)

`.claude/skills/video-talkcraft/` is an unmodified copy of
[`video-talkcraft`](https://github.com/Vincentwei1021/video-talkcraft), the
narration-video sibling of video-shotcraft (script + voiceover in, every motion
beat locked to the voice). Its README is mirrored in English at
`docs/video-talkcraft-en/README.md`; its `SKILL.md`, references and cards are
Chinese and are not translated here.

**It is not under Apache-2.0.** It is licensed under the
**PolyForm Noncommercial License 1.0.0** (see `.claude/skills/video-talkcraft/LICENSE`):
noncommercial use is free and *any commercial use of the toolkit requires prior
authorization from the author* (Vincent Wei). Videos made with it belong to their
creators; the licence covers the toolkit itself. Third-party components are listed in
`THIRD_PARTY_NOTICES.md`. Before any talkcraft code, card or script is used in a
commercial product, obtain the author's written permission. No talkcraft code is
imported by Motion Director at runtime.

## Upstream audio change (not yet followed)

Since upstream commit "Source project SFX from Freesound" (2026-10-29), video-shotcraft
no longer ships a shared SFX library: each film downloads CC0 / CC BY clips from
Freesound with a manifest (`audio-manifest.json`, `FREESOUND-CREDITS.md`); see
`.claude/skills/video-shotcraft/references/sfx-sourcing.md`. Motion Director still uses
the bundled `public/motion-studio/sfxlib/**` copy described above. Several of its records
are marked unverified in `AUDIO-ATTRIBUTION.md`, so confirm the licences before commercial
distribution.

