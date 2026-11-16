# Personalization Studio: audio mix

Step 4, **Audio mix** card (right column, above Layers). Free: nothing here calls a paid API or uses credits.

## What it does

- **Video sound**: volume, mute and solo for the sound already in the video. Your original file is never changed.
- **Tracks** (up to 6, music or voiceover): add an MP3, M4A, WAV, OGG or AAC file (up to 25 MB each). Each track has its own
  volume, **start** time on the video, **skip** (seconds of the file to skip), **fade in**, **fade out**, mute and solo, a type
  (music defaults to half volume, voiceover to full), and a **waveform** on a strip as wide as the video so its start and length
  are visible.
- Mute silences a channel; Solo plays only that channel (the video's sound counts as a channel). Muted or un-soloed tracks are not
  mounted at all, so they cannot leak into the export.
- The old single `audio` setting keeps working: with no mix it plays as one music track at full volume, and a recast's own sound is
  still used as a fallback.

## How it works

`preview/audioMix.ts` is pure and works in frames: `trackGainAt` gives the gain of a track at any frame (outside its window, fade
ramps, volume, mute/solo) and `videoGain` the video's. The composition mounts each audible track as
`<Sequence from=start><Audio trimBefore volume={frame => gain}/></Sequence>` and sets the video element's `volume`, so the live Player
and the browser export compute the same numbers. Settings (`audioTracks`, `videoVolume`, `videoMuted`, `audioSolo`) are optional and
normalized, so saved projects are unchanged. A track whose upload has not finished (a local `blob:` URL) is not saved.

## Verified (real modal, real export, measured with ffmpeg)

`e2e/personalization-audio-mix.spec.ts`, using the demo clip (which has sound) and pure test tones:

- Video sound off + a music track starting at 1 s, half volume, 1 s fade in and 1 s fade out (5 s video), mean volume by segment:
  before the start **-91 dB** (silent), first quarter second of the fade-in **-48 dB**, mid-fade **-33 dB**, steady section
  **-29.0 dB** (the tone is -23.0 dB, so half volume = -29.0 dB exactly), end of the fade-out **-43 dB**.
- A muted track leaves only the video's own sound (**-18.4 dB** vs the clip's -18.1 dB); soloing the track leaves only the track
  (**-23.0 dB**, equal to the tone).

## Known limits

- **Trim end** (cut the tail of a track) is not a control: a track plays until the file or the video ends. The data model supports a
  `length`, and fades are measured to the end of the video.
- **Timeline lanes**: the track's position is shown on its waveform strip in the Audio card, not as a lane in the main timeline.
- Volume is 0 to 100%; there is no boost above the file's level and no volume automation curve beyond the two fades.
- The waveform is decoded in the browser; an undecodable file shows no waveform but still plays if the browser can play it.
- Tracks use the browser's audio decoder and are mixed by the exporter; preview playback with several long tracks may use more CPU.
