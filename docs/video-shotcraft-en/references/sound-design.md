# sound-design — Sound Design

Source: hands-on sound design for the template video (`template/`). For rule IDs S1–S4 see `references/aesthetic-rules.md`.

All of the template video's sound is managed centrally in one file (`template/src/aifl/Main.tsx`: the `SFX[]` frame-pin table); scene components contain no audio code at all — sound is a timeline-level asset, not a shot-level asset.

## Contents

- Method
- BGM selection
- SFX vocabulary
- Alignment techniques

---

## 1. Method

**Order: picture structure basically locked → lay down BGM first to set the energy skeleton → pin SFX beat by beat.**

1. **BGM first, setting the energy skeleton.** One BGM track underlies the whole video, with a volume envelope using `interpolate` for fade-in and fade-out at start and end (template video `[0, 30, TOTAL-50, TOTAL] → [0, 0.34, 0.34, 0]`, i.e. 1s fade-in, 1.7s fade-out). Keep BGM volume around 0.34 to leave headroom for SFX. The track's energy curve must match the storyboard table's energy curve (low opening → mid-section build → outro peak); candidate tracks must be laid under the finished video for listening — you cannot judge the temperament by listening to the track alone (S1). Mount the BGM `<Audio>` wrapped in a boolean inputProp (e.g. `bgm`, default `true`); SFX are unaffected by this switch — videos with BGM always deliver two final renders, with the without-BGM version rendered from the same timeline: `npx remotion render … --props=props-nobgm.json` (file content `{"bgm":false}`; Windows shells strip the double quotes from inline JSON, so using the file is safest; on macOS/Linux you can also inline `--props='{"bgm":false}'`).
2. **Choose the vocabulary by "genre", not by "event" (S1).** The SFX vocabulary for product promos = whoosh (camera move) / impact (landing) / riser (build-up) / sparkle (light effect, directory `light/`) / transition (transition); game sound pack **timbres** are banned (synth pluck/bloop, cartoon bounces). The first version of the template video chose sounds by UI event semantics (click/drop/confirmation), and the user condemned it at first listen: "too much like a game".
   **What is banned is the timbre, not the action**: if the picture really has a click/toggle/shatter it should get its foley (the template video itself uses `click-camera.mp3` and gives it the highest loudness in the whole video, 0.6); but `sfx/ui/` needs auditioning one by one — it contains both real switch foley and synthesized feedback sounds, the latter being exactly the texture this rule excludes (keep/drop table in 3.3); `sfx/glass/` is real shattering material sound. For the deciding question see aesthetic-rules S1.
3. **Pin SFX beat by beat to frames, managed centrally in a declarative table (S2).** SFX are a `{ from, src, volume }[]` array, each entry commented with its corresponding picture action ("hero card: whoosh up on the pop"); at render time each entry is wrapped in a `<Sequence from={s.from}>`. This eliminates sound effects scattered by feel.
4. **Beyond generic sounds, leave "picture-specific custom" slots.** After the vocabulary is finalized, distinctive picture actions still need dedicated foley (typing reveals get keyboard sounds, weeks dropping in one by one get pops) — a generic swoosh can't cover these actions (S4).

Timing lesson: the template video's audio work didn't start until after about 30 rounds of picture changes (the last few rounds of wrap-up); once, swapping the BGM and redoing the picture were mixed into the same round of changes; the picture then kept changing, and the whole SFX table was scrapped and re-pinned. **Sound always comes after the picture is locked** (S3); details in section 4.

---

## 2. BGM selection

### Evolution: three drafts (34 minutes)

| Draft | Track | Source/license | Reason replaced |
|---|---|---|---|
| v1 | Kevin MacLeod – *Inspired* (warm ambient piano bed); the alternative *Deliberate Thought* was downloaded in the same batch but never referenced | incompetech, CC-BY | User: "Change the BGM to something with more rhythm, more passionate and upbeat" — piano ambient wasn't passionate enough |
| v2 | Kevin MacLeod – *Life of Riley* (upbeat folk-pop) | incompetech, CC-BY | User: "This music and these sound effects are too much like a game. Find me something with strong drums and a strong sense of rhythm" — upbeat ≠ promo temperament |
| v3 (final) | Mixkit tech-house drum bed (`bgm-tech-house.mp3`), volume raised to 0.34 | Mixkit license | Never replaced again, kept through to the finished video |

v1→v2 was rejected again only 22 minutes later — which shows that when choosing the track it was never listened to in the context of the finished video. **Candidate tracks must be laid under the finished video and listened to before deciding** (S1 self-check item).

### Selection criteria (inferred back from the user's own words)

- **Strong drums, strong sense of rhythm**; prefer an electronic bed (tech-house type); "sounds nice/upbeat" is not a criterion.
- The temperament benchmark is "a typical product promo video" — close your eyes and listen only to the audio track; it should sound like a product launch trailer, not a mobile game (S1).
- The energy curve can support the whole video's structure: a steady drum bed suits layering SFX; tracks with overly assertive melodies will clash with the foley.

### List of free-license sources

| Source | License | Suitable for | Notes |
|---|---|---|---|
| [Mixkit](https://mixkit.co/) | Mixkit License (free commercial use, no attribution required) | BGM + cinematic SFX (whoosh/impact/riser/sparkle) + all kinds of foley | The main source of the template video's final BGM and SFX; after batch downloading, metadata is often stripped, so **record the track name/URL at download time**, otherwise it can't be traced back later (the template video's `bgm-tech-house.mp3` can no longer be matched track by track back to the Mixkit library; re-verify before commercial use) |
| [incompetech](https://incompetech.com/) (Kevin MacLeod) | CC-BY 4.0 (attribution required) | BGM, large library, filterable by mood | Source of the template video's v1/v2; note the CC-BY attribution obligation |
| [Kenney](https://kenney.nl/assets) (sound packs) | CC0 | Game projects | **Banned for product promos** (S1) — after being introduced into the template video they were deleted as a whole batch; listed here only for the license archive |

---

## 3. SFX vocabulary

### 3.0 Directory structure and sound-finding path

```
assets/audio/
  bgm/                5 tracks  BGM candidates (tech-house drum bed + house/hip-hop)
  sfx/<category>/   149 files   divided by scenario/material into 16 categories
```

**To find a sound, first decide the category, then pick the timbre** — look up the picture action to be scored in the table below, and go into the corresponding directory to audition.

The mapping from the five S1 vocabulary words to directories (**the directory name for `sparkle` is `light/`; there is no `sparkle/` directory in the library**):

| Vocabulary | whoosh | impact | riser | sparkle | transition |
|---|---|---|---|---|---|
| Directory | `transition/` | `impact/` | `riser/` | **`light/`** | `transition/` |

whoosh and transition are both in `transition/` (the timbres of camera moves and transitions overlap anyway); the other 11 categories are the **foley layer** outside the vocabulary (S4's "picture-specific custom" slots).

| Category | Count | Contents | When to go into this directory |
|---|---|---|---|
| `transition/` | 23 | whoosh / sweep / swoosh / wind | Camera moves, scene changes, elements flying in and out |
| `impact/` | 14 | impact / thud / stomp / bass hit | Landing pins, downbeats, slams |
| `riser/` | 1 | Rising build-up | Energy build-up before the finale / big shots |
| `camera/` | 10 | Shutter, lens, zoom | Photo feel, crash zoom, focusing, iris |
| `ui/` | 18 | Clicks, switches, notifications, pops | UI feedback, theme switching, list items dropping in |
| `text/` | 13 | Typewriter, keyboard, writing | Typing reveals, line drawing, underlines |
| `paper/` | 10 | Paper, page-turning, printing | Page-turn transitions, tearing, paper craft, riso |
| `film/` | 8 | Projector, film, tape, vinyl | Trailer grammar, film strips, rewind speed changes |
| `light/` | 10 | sparkle, light effects | Light sweeps, lighting up, afterglow flashes |
| `data/` | 13 | glitch, electric current, data | HUD, streaming output, skeleton screens, glitches |
| `scifi/` | 5 | Tech, space, noise floor | Space camera moves, system noise floor (long-sample beds) |
| `mech/` | 8 | Mechanical, industrial, locks | Part assembly, locking, morphing |
| `glass/` | 4 | Glass, shattering | Shatter transitions, hard-cut impacts |
| `fluid/` | 5 | Ink, water, fluid, particles | Ink openings, particle fills, bubbles |
| `crowd/` | 3 | Crowd, applause, breathing, heartbeat | Group-photo endings, launch-event feel, tension |
| `counter/` | 4 | Counters, gauges, clocks, countdowns | Digit rolls, readouts, timelines |

Per-file duration / peak / suggested pin points are in `assets/audio/AUDITION-2026-07-27.md`; licenses and URLs are in `assets/audio/ATTRIBUTION.md`.

Note: categories are **an index for finding sounds, not a criterion for scoring**. Sound selection still follows the genre vocabulary discipline of section 2 — material sounds like `glass/` `crowd/` `fluid/` are "picture-specific custom" slots (S4); generic transitions still prefer `transition/` `impact/`.

### 3.1 Base layer: the 14 files actually used by the template video

The table below is the batch used in the template video's final version; **the "Typical pin position" is the only sound data in this repo with real-world frame numbers**; when reusing, take its relative semantics rather than its absolute values (30fps, whole video 1085f). Durations come from ffprobe. The path column gives the location after restructuring.

| File | Directory | Duration | Use case | Typical pin position (template video) | Source and license |
|---|---|---|---|---|---|
| `bgm-tech-house.mp3` | `bgm/` | 288.7s | Whole-video drum bed BGM, tech-house electronic | Underlies the whole video, volume envelope 0→0.34→0.34→0 | Mixkit (cannot be traced back track by track; re-verify before commercial use) |
| `transition-soft.mp3` | `sfx/transition/` | 1.27s | Soft transition: brand settling, cutting into a scene | f12 / f277 / f475 / f623 / f779 (one hit each time a new scene starts) | Mixkit |
| `whoosh-fast.mp3` | `sfx/transition/` | 1.76s | Fast camera moves, batches of elements flying away | f78 brand→dashboard, f340/356 card-dealing acceleration, f435 filtered grid flies away | Mixkit |
| `whoosh-big.mp3` | `sfx/transition/` | 2.32s | Large camera moves: pop-up, pull-back, swing-back | f127 hero card pops up, f308 orbit pull-back, f388 swoosh back to the search bar | Mixkit |
| `sparkle.mp3` | `sfx/light/` | 4.55s | Light-effect reveals: scanning beams, closing flashes | f141 hero card beam, f1005 ending rule flash | Mixkit |
| `transition-snap.mp3` | `sfx/transition/` | 0.57s | Short, crisp snap for settling/snapping back into place | f204 hero card impact reseat | Mixkit |
| `swoosh-quick.mp3` | `sfx/transition/` | 0.78s | Uniform title card entrance sound, light push-ins | f220/565/725/885 four title cards, f455 push-in after the click | Mixkit |
| `keyboard.mp3` | `sfx/text/` | 19.6s | Real keyboard typing foley (long sample, trimmed by segment) | f401 search box input (trimmed to 24f), f781 weekly report page "writes itself" (trimmed to 44f) | Mixkit |
| `click-camera.mp3` | `sfx/camera/` | 0.35s | Click confirmation/shutter feel (loudest in the whole video, vol 0.6) | f451 clicking a card to open details, f648 papers count settles | Mixkit |
| `riser-cine.mp3` | `sfx/riser/` | 4.81s | Cinematic rising build-up, into the finale | f945 start of the outro group-photo assembly section | Mixkit |
| `impact-cine.mp3` | **deleted from the library** | 4.06s | Cinematic heavy accent pin (vol 0.55, the whole video's SFX peak) | f980 wordmark stamp lands | Mixkit |
| `pop.mp3` | `sfx/ui/` | 0.48s | Short pops for list items dropping in one by one | f840–865 weekly report week list, 6-shot burst, one every 5f, volume stepped down 0.40→0.25 | **Source to be determined** |
| `impact-transition.mp3` | `sfx/impact/` | 4.87s | **Dead asset: never referenced in the whole video**, a spare impact downloaded in the same batch as the final SFX | None | Mixkit (same batch), not wired up |
| `typewriter.mp3` | **deleted from the library** | 0.22s | **Dead asset: never referenced in the whole video**. The document page reveal actually uses `keyboard.mp3` trimmed to 44f; this file was downloaded but not wired up | None | **Source to be determined** |

Summary: 12/14 actually sound in the video; 2 dead assets (`impact-transition.mp3` kept in the library, `typewriter.mp3` deleted); `pop.mp3`, whose source is to be determined, is still in the library.

**Handling of the two deleted files (2026-07-27 screening)**:

- `impact-cine.mp3` has been deleted from `assets/audio/`, but **the template video still renders as usual** — Remotion reads the independent copy in `template/public/audio/` (`staticFile('audio/...')`), which still exists, and `Main.tsx:86` needs no change. When a new project wants to reproduce the outro three-beat phrase, use `sfx/impact/impact-deep-whoosh.mp3` instead: it is **byte-for-byte identical** to the original `impact-cine.mp3` (md5 `ce27fd2f`, see 3.2), the same Mixkit asset Cinematic whoosh deep impact.
- `typewriter.mp3` has been deleted (it was a dead asset anyway; typing reveals actually use `keyboard.mp3` trimmed by frames). For single-keystroke foley use `sfx/text/typewriter-hit-single.mp3` or `typewriter-hit-hard.mp3` instead.

### 3.2 Same asset under different names: 4 pairs of byte-identical files

A library-wide md5 comparison on 2026-07-27 found that in the base layer and the first expansion batch there are 4 pairs that are **the same Mixkit asset downloaded twice and saved under two names**:

| Pair | Actually the same asset | Current status |
|---|---|---|
| `transition/transition-soft` = `transition/air-zoom-vacuum` | Air zoom vacuum | Both present |
| `transition/swoosh-quick` = `transition/sweep-fast-small` | Fast small sweep transition | Both present |
| `impact/impact-transition` = `impact/impact-epic-trailer` | Movie trailer epic impact | Both present |
| `impact/impact-cine` = `impact/impact-deep-whoosh` | Cinematic whoosh deep impact | `impact-cine` deleted, `impact-deep-whoosh` kept |

**These pairs cannot be used for 4.2's "two-sample alternation"** — they're byte-identical, so alternating is the same as not changing the sound, and the machine-gun effect remains.
If you really need two samples, pick files from the same category with similar but different timbres (e.g. `text/typewriter-hit-hard` + `text/typewriter-hit-soft`).

Lesson: the same asset appearing under different names in the library is the inevitable result of "judging duplicates by filename after batch downloading". **When adding new sound effects to the library, first run an md5 dedup**; don't trust names:
```bash
find assets/audio -name '*.mp3' -exec md5 -r {} \; | sort | awk '{print $1}' | uniq -d
```

A by-product of the comparison was recovering the original URLs of 7 base-layer files (see `ATTRIBUTION.md`); this batch originally couldn't be traced back because metadata was lost during batch downloading.

### 3.3 The `ui/` directory must be auditioned one by one; it cannot be approved as a whole directory

`ui/` is the only category in the whole library whose **internal texture is split**: it has both real object foley and synthesized UI feedback sounds — and the latter are exactly what S1 excludes. Looking at the original Mixkit names is the easiest way (`tone` / `bleep` / `alert` / `notification` are strong signals of synthesized sounds):

| File | Original Mixkit name | Texture |
|---|---|---|
| `switch-light` | Light switch sound | ✅ Real light switch |
| `switch-tap` | On or off light switch tap | ✅ Real light switch |
| `switch-click-quick` | Quick switch click | ✅ Real switch |
| `pop` | (source to be determined) | ✅ Used in the template video's final version (weekly report week list 6-shot burst) |
| `hitech-touch-magnet` | Hi-tech touch with magnet | ⚠️ Magnetic-snap texture, leaning synthetic but with a physical feel; decide by the video's tone |
| `chime-crystal` | Crystal chime | ⚠️ Crystal wind chime; a light-effect/decorative sound rather than UI feedback; can also be used the `light/` way |
| `pop-electric` | Electric pop | ⚠️ Electronic pop; usable in burst scenarios, slightly synthetic as a single hit |
| `ui-select-click` | Select click | ⚠️ Interface click, cleaner than the ones below |
| `ui-click-tone` | Cool interface click tone | ❌ Synthesized tone |
| `ui-confirm-bleep` | High tech bleep confirmation | ❌ Synthesized bleep |
| `ui-confirm-tone` | Confirmation tone | ❌ Synthesized tone |
| `ui-tone-quick` | Digital quick tone | ❌ Synthesized tone |
| `ui-success-soft` | Success software tone | ❌ Synthesized tone (the "success" semantics are exactly the kind rejected in the S1 precedent) |
| `ui-notify-tech` | Technology notification | ❌ Notification sound |
| `ui-message-pop` | Message pop alert | ❌ Notification sound |
| `ui-popup-dry` | Dry pop up notification alert | ❌ Notification sound |
| `ui-option-select` | Interface option select | ❌ Synthesized interface sound |
| `ui-select-modern` | Modern technology select | ❌ Synthesized interface sound |

Usage:
- ✅ tier can be used directly as foley for interaction actions (the switch in `theme-switch-moves`, the gear change in `segmented-thumb-hero`).
- ⚠️ tier **must be auditioned in the context of the finished video** before deciding; don't listen to it alone.
- ❌ tier is not used for product promos by default. **Exception**: the video deliberately wants a "the system is speaking" narrative (HUD announcements, AI confirmation receipts, error demos); then it's an intentional style choice — per the aesthetic-rules usage, intentional violations of the rules must be written into the project documentation.

The same one-by-one audition discipline applies to `data/` and `scifi/` (which naturally have many synthesized sounds), except that those two categories are intended for "digital/tech texture" anyway, and aren't mistaken for generic interaction foley the way `ui/` is.

## 4. Alignment techniques

### 4.1 Frame-pinning method

- **Declarative central registry**: `SFX: { from, src, volume }[]`, each entry commented with its corresponding picture action; the render layer iterates over the array and wraps each entry in a `<Sequence from={s.from}>`. The frame number table and the storyboard table (`AIFL_SHOTS`) are placed in the same file for cross-reference (S2).
- **Long samples are truncated via Sequence, not by editing the audio file**: `keyboard.mp3` (a 19.6s original asset) is given `durationInFrames` of 24f or 44f depending on context; the others uniformly get 90f so that ≤3s assets play out naturally. Audio duration is exactly equal to the picture action (S4). **21 files in the library are longer than 5s and must be given an explicit `durationInFrames`**; using the 90f default they keep sounding after the action ends (see table below).
- **Volume layering**: BGM 0.34 as the bed, SFX in the usual range 0.2–0.6 — click confirmation 0.6 is the loudest, the tail of the pop burst 0.25 is the quietest; loudness expresses "how important this beat is" (the 0.14 that once appeared came from the deleted v2 pluck burst and is not part of the final range). **But 0.2–0.6 presupposes that the asset's peak is close to 0dB**: `volume` is a multiplier, not a target volume; the 7 files in the library that are inherently recorded quietly (peak <-12dB) may still be buried by the BGM even at 1.0 — the first choice is to swap the asset or pre-normalize; if necessary you can give gain >1 (Remotion supports it, but the preview clamps to 1.0, so the peak must be verified on the rendered output). The list and the three ways out are below. After pinning, listen to the rendered output; don't just trust the numbers.

#### Long samples that need explicit truncation (>5s, 21 files)

| File | Duration | Usage |
|---|---|---|
| `scifi/scifi-computer-ambience` | 23.5s | Noise floor, laid under an entire shot |
| `film/projector-spin-antique` | 21.7s | Noise floor/loop, truncated by segment |
| `text/keyboard` | 19.6s | Typing segments; the template video trims to 24f / 44f |
| `text/write-blackboard` | 13.9s | Line-drawing segments, truncated by stroke duration |
| `mech/mech-robotic-futuristic` | 9.6s | The whole assembly/morph |
| `camera/camera-autofocus` | 9.6s | Focusing; generally only the first 10–20f are used |
| `paper/paper-book-browse-fast` | 9.3s | Continuous page-turning, truncated by number of pages |
| `scifi/space-intro-futuristic` | 8.1s | Opening build-up |
| `light/light-spell` | 8.0s | The whole lighting-up |
| `impact/impact-cine-big` | 7.9s | Landing, with a long reverb tail; truncating the tail sounds dry |
| `scifi/tech-hum-futuristic` | 6.0s | Noise floor |
| `transition/wing-flutter` `swoosh-slow` `wind-pass-vibrate` | 5.0–5.7s | Camera moves, matched to camera-move duration |
| `paper/paper-wind-blow` | 5.5s | The whole paper scattering |
| `mech/metal-drop-scifi-small` | 5.5s | Settling, with a tail |
| `light/light-aura` `light-transition-magic` | 5.1–5.5s | Light-effect afterglow |
| `impact/impact-movie-epic` | 5.1s | Landing, with a long tail |
| `data/power-up-electronic` | 5.0s | The whole start-up/lighting-up |
| `crowd/applause-rhythmic-loop` | 5.0s | Loopable applause |

Criteria: **noise floor/loop types** (ambience, hum, projector) are laid for the shot duration; **action types** are truncated to the action duration; **impacts with long reverb tails** (`impact-cine-big` `impact-movie-epic` `metal-drop-scifi-small`) let the tail decay naturally; hard truncation sounds dry.

#### Files inherently recorded quietly (peak <-12dB, 7 files)

**First get one thing straight: `volume` is a multiplier, not a target volume.** `volume={1}` just means "play as-is" — if the asset itself is -24.6dB, after giving 1.0 it's still -24.6dB. Meanwhile the BGM peaks near 0dB, and laid as a bed at 0.34 it is about -9.4dB, so even at the upper limit of 1.0 `data-load-os` is still 15dB below the BGM, **and still gets buried by the drum bed**. "Capping volume at 1.0" is ineffective advice.

| File | Peak | Below BGM (-9.4dB) by | To rise above BGM (about -6dB) needs |
|---|---|---|---|
| `data/data-load-os` | -24.6dB | -15.2dB | ~8.5x |
| `text/pencil-write-short` | -22.7dB | -13.3dB | ~6.8x |
| `text/write-fast` | -20.0dB | -10.6dB | ~5.0x |
| `transition/wing-flutter` | -17.9dB | -8.5dB | ~3.9x |
| `camera/ui-zoom-in` | -14.3dB | -4.9dB | ~2.6x |
| `counter/clock-knob-spin` | -14.0dB | -4.6dB | ~2.5x |
| `counter/clock-tick-single` | -13.9dB | -4.5dB | ~2.5x |

Three ways out, in order of priority:

1. **Swap the asset (first choice)**. Find a replacement in the same category whose peak is near 0dB — `data/` has 12 other options, `counter/` has 3, `text/` has 12. Raising the gain of a quiet asset raises its noise floor too; swapping in a well-recorded one is less trouble than rescuing one.
2. **Pre-normalize** (when you want to keep this timbre). Normalize with ffmpeg before adding to the library, cleaning it up once, so that when pinning you can use the usual 0.2–0.6 range:
   ```bash
   ffmpeg -i in.mp3 -af "loudnorm=I=-16:TP=-1.5" out.mp3   # or -af "volume=8.5"
   ```
3. **Give `volume` a gain greater than 1**. Remotion **allows** `volume>1` and really amplifies — measured in this repo: `data-load-os` with `volume={4}` outputs -12.7dB, with `{16}` outputs -0.7dB (i.e. 4x≈+12dB, 16x≈+24dB, consistent with the 20·log₁₀ conversion). Verified against the Remotion source: `validateMediaProps` only blocks `volume<0`, not >1; the Web Audio path writes the value directly into `gainNode.gain` without clamping.
   Two preconditions you must know:
   - **The preview clamps to 1.0**; `Math.min(volume, 1)` only appears in the traditional `<audio>.volume` fallback path (Safari / when Web Audio is disabled). In other words, **what you hear in the preview may be quieter than the finished video**, and you must judge by the rendered output.
   - **Raising the gain also raises the noise floor, and may clip**. Always check the peak after rendering; if `max_volume` approaches 0.0dB, back off the gain or switch to option 1/2:
     ```bash
     ffmpeg -hide_banner -i out.mp4 -af volumedetect -f null /dev/null 2>&1 | grep max_volume
     ```

Conversely: most files in the library peak near 0dB, and giving 0.6 is already the magnitude of "the loudest beat in the whole video". When adding new sound effects to the library, record the peak while you're at it:

```bash
ffmpeg -hide_banner -i <file>.mp3 -af volumedetect -f null /dev/null 2>&1 | grep max_volume
```

### 4.2 Pitch shifting and anti-machine-gun

**This repo has empirically no playbackRate pitch shifting** (`grep playbackRate` across the whole template video repo has zero hits). Preventing the machine-gun effect when similar elements fire in succession relies on a combination of three tricks (S2), not on pitch shifting:

1. **Two-sample alternation**: bursts alternate between two similar samples (the template video's deck-deal 8-shot burst alternates pluck_002/pluck_001).
2. **Stepped volume decrease**: linear attenuation along the sequence creates a "sense of distance" — the final pop 6-shot burst 0.40/0.37/0.34/0.31/0.28/0.25.
3. **Intervals accelerate following the animation curve**: burst intervals shrink with the picture's accelerating beat (8f→3f); when it gets so dense it blurs together, **actively let the sound fade out into a single swoosh**, rather than scoring each one — the ear, like the eye, can't distinguish blurred individuals.

Target listening impression: burst segments are "a rhythm you can count", not mechanical repetition (S2 self-check item).

### 4.3 riser→impact: the shot-closing phrase

The fixed three beats for big shots (especially the outro):

```
riser-cine (start of the assembly/build-up section) → about 35f later impact-deep-whoosh (subject stamp lands, the whole video's loudness peak) → 25f later sparkle (afterglow light effect)
```

Template video f945→f980→f1005; it is the only segment phrase that was never changed after the final sound direction was established (in the template video the middle beat's file is named `impact-cine.mp3`, which has been deleted from the library; the equivalent file in the library is the byte-identical `impact-deep-whoosh.mp3`, see 3.1) — the energy build-up, pin and afterglow trio got right in one go. Other reusable small phrases: scene change = one hit of `transition-soft`; title card entrance = `swoosh-quick` as the uniform sound; click confirmation = `click-camera` (given the highest SFX loudness in the whole video).

### 4.4 Rework lesson: the ordering ledger of three re-pins

The template video's whole SFX table was re-pinned three times, of which **two were purely the knock-on cost of picture rework** (S3):

| # | Cause | Nature |
|---|---|---|
| 1 | Wrong timbre direction (game sound pack → cinematic vocabulary) | Rework of the sound itself, unavoidable |
| 2 | Picture timeline change (total length 1020→1085), all from values shifted | **Knock-on cost of pinning sound before the picture was locked** |
| 3 | Animation added to the weekly report section's picture; that section's SFX rewritten | Same as above (local) |

Codified as a rule: **do sound after the picture is locked; for any change that alters shot duration/order, the wrap-up action always includes "realign SFX frame numbers across the whole table"** (S3). Counterexample: once, swapping the BGM and redoing the deck-deal picture were crammed into the same commit; the picture then changed again, and the sound effects were pinned for nothing.

### 4.5 Frame pins are always relative to the shot start, not absolute frames (hard rule)

The template video's SFX table pins **absolute frame numbers**; a single-file array makes it easy to shift the whole table (the 2nd re-pin was done in one diff), but absolute frames mean zero structural reuse — if any one shot changes duration, all entries after it become invalid.

Practice: write frame pins as `SHOTS.<shot>.from + offset` (an offset relative to that shot's start; for beat-synced videos write `beatF(n)`, see music-beat-sync.md). That way, when a shot's internal beats don't change, changing the duration of an earlier shot only requires updating one place in the storyboard table, and the SFX follow automatically — most re-pinning can be avoided. New projects write relative frame pins from the start; never bare numeric frame numbers.

### 4.6 Audio-picture alignment adds two offsets (hard rule)

The design intent is "the source's peak lands on the target beat frame"; between intent and the finished video lie two offsets, and if
neither is compensated they add up — measured in this repo, the heaviest hit was 0.27s late, clearly reading as audio-picture out of sync;
in beat-synced videos a difference of 2–3 frames is enough for the audience not to hear that "this hit follows the drum", and reasonable on-beat
motion reads as unprovoked shake (S5 precedent). Unified formula (floating-point calculation, round in the last step):

```
Sequence.from = target peak frame − source peak lag frames − output audio track offset frames
```

**Offset one: final output audio track offset (measured per render pipeline).**
The entire audio track of the rendered finished video has a fixed lag relative to the video. The root cause is in the **output encoding/muxing
chain**, not in the behavior of `<Audio>` or `Sequence.from`: the AAC encoder has
encoder priming (warm-up samples padded at the head), typically 2048 samples at 48kHz
= 1.28f@30fps. This repo's AiflPromo measured a click lag of 2032 samples and an
impact lag of 2066 samples (≈1.27–1.29f), matching the priming fingerprint; and the rendered output's
(aifl-ref.mp4) audio track edit list (elst media time=0) did not declare trimming of this
padding head, so after decoding it manifests as a real offset. Remotion officially tracks the same family of issues:
remotion-dev/remotion#7099.

- **Record per pipeline, not per "video"**: the offset is determined by the four elements Remotion version + audio codec +
  sample rate + container, and the measured value is archived together with the four elements; if the four elements don't change
  it can be reused; if any one changes it must be re-measured. The priming magnitude varies by encoder (ffmpeg built-in
  aac ≈1024, fdk-aac 2048, Apple ≈2112 samples), so a constant cannot be presupposed.
- In the promo-ink era **4f** was measured (≈133ms/6400 samples), a magnitude far beyond what
  priming can explain, root cause not verified — kept only as warning data that "old constants cannot be carried across pipelines",
  not as a statement of mechanism.

Measurement method (done after rendering; measuring accurately once per pipeline applies generally):

```bash
ffmpeg -i out/promo.mp4 -vn -acodec pcm_s16le /tmp/render-audio.wav
```

Take the **original files** of 2–3 sharp SFX and do normalized cross-correlation against the rendered audio track (numpy
`np.correlate` is enough); the peak position minus the designed frame number is the offset; it counts as measured accurately only if multiple probes'
residuals agree; measuring only one point may run into the source's own peak lag.

**Offset two: the source's own peak lag (measured per file).**
For many assets the energy peak is not at the file head (crescendo attacks, leading breaths); aligning by the file head means
arriving late. Measured examples: brush-write 2f, paper-slide 10f, ink-char as much as 24f.
The peak position is located with the audio energy envelope, and recorded together with max_volume when a new sound effect is added to the library
(see 4.1; the same principle as music-beat-sync §4 "assets are aligned by their internal peak, not by the file
head").

Render-layer implementation — the SFX table keeps the §4.1 `{ from, src, volume }` schema unchanged;
the three-way split happens in the `from` calculation expression (complete audit trail; never hand-edit frame numbers entry by entry):

```tsx
// Measured on this pipeline: Remotion 4.x + AAC 48kHz mp4, 2026-08-23, click/impact dual-probe cross-correlation
const OUTPUT_AUDIO_OFFSET_F = 1.28;
const PEAK_F: Record<string, number> = { 'impact-deep-whoosh.mp3': 2 /* measured per file */ };
const sfxFrom = (targetPeakF: number, src: string) =>
  Math.max(0, Math.round(targetPeakF - (PEAK_F[src] ?? 0) - OUTPUT_AUDIO_OFFSET_F));
// In-table usage: { from: sfxFrom(SHOTS.outro.from + 35, 'impact-deep-whoosh.mp3'), src: …, volume: 0.55 }
```

Two boundary notes:
- **durationInFrames gets no offset**: after the whole window moves earlier, its start and end points return to place together
  perceptually; lengthening the window of a truncated-type sound effect (one that trims a long sample with an explicit durationInFrames)
  would play extra content that should have been cut.
- The `Math.max(0, …)` floor means pins within roughly the first 2f of the video can't be fully compensated;
  record the residual in the acceptance table; try not to design opening accents in the first 2 frames.

The BGM side works the same way but is accounted for in a different place: the source music grid constant `SOURCE_BEAT0` keeps the analyzed
true value untouched, and the output offset is set as a separate constant participating in the `beatT` conversion, see music-beat-sync
§5b — both share the same cross-correlation measurement method.

Acceptance: after compensating, re-render and rerun cross-correlation on 2–3 probes; residuals ≤0.5f pass.
