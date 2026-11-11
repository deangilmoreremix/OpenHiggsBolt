# Run one real AI-created film (Motion Director)

Goal: one promotional film made by the real AI Director from the customer's real photos, with the existing browser renderer. No mocks.

## Needed (the two blockers in this environment)
1. An authorized OpenAI key, supplied through the app's own BYOK mechanism. This container has none (`MS_LIVE_OPENAI_KEY`, `OPENAI_API_KEY` unset; `api.openai.com` is reachable, answers 401 without a key).
2. The customer's inputs: their photographs, business name/logo/colours, and a plain request.

## Through the application
1. `npm run dev`, sign in.
2. Settings → add the OpenAI key (stored by the app's BYOK mechanism; never put it in a file or in chat).
3. Brand Kit: business name, logo, colours.
4. Motion Director: attach the customer photos; type e.g. `Make a 30-second promotional video for <business>. Show the photos, end with a call to book a visit.`
5. Choose **Let the director pick shots** (autonomous). Read the product brief, the chosen direction, the feature→shot map and the storyboard.
6. **Approve & build film.** Watch: adaptation of each shot's source → frame QA → review. The chat states how many shots were adapted, and the film is a *draft* until the independent review passes.
7. **Open in Motion Workbench**: confirm clips, text, images, sound are editable.
8. **Export video** (draft first, then full). Rendering is in the browser (~15 min for 22 s in the build sandbox; ~3 min for a draft).

## Dev shortcut (no key entry in the UI)
Start the dev server with the key exported in the shell only: `MS_LIVE_OPENAI_KEY=… npm run dev`. The route accepts it only when `NODE_ENV !== 'production'` and for the dev bypass user; it is never written to disk or logged (only the last 4 characters appear as a hint).

## What to inspect in the output
For each scene: are the customer's pictures inside the animation (not an overlay)? Does the camera move like the ShotCraft reference? Does the sound land on the action? Compare against `.claude/skills/video-shotcraft` cards (`.card.md`) and the original TSX under `src/apps/motion-director/demosrc/`.

## Handing it to Claude
Provide the key as an environment variable on the session's container and the photos/brand/request; Claude then runs exactly this flow in the real UI, captures key-stage screenshots and the exported MP4, and fixes only a scene that is wrong.
