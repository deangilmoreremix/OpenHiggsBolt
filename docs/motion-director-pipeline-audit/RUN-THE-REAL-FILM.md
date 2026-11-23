# Run one real AI-created film from a website URL (Motion Director)

Goal: the video-shotcraft workflow from a URL alone. The customer gives a website address and a request; Motion Director discovers the business name, logo, colours, fonts, images, copy and pages through the existing website capture and asset finder, and the real AI Director adapts the original ShotCraft recipes with them. No Brand Kit, no uploads, no manual brand entry. The browser renderer is unchanged.

## The only external prerequisite
An authorized OpenAI key, supplied through the app's own BYOK mechanism. This container has none (`MS_LIVE_OPENAI_KEY` and `OPENAI_API_KEY` are unset; the dev bypass user has no stored key). `api.openai.com` is reachable (401 without a key), so nothing else blocks the run.

## Through the application
1. `npm run dev`, sign in. Settings → add the OpenAI key (stored by the BYOK mechanism; never put it in a file or in chat).
2. Motion Director → type:
   `Create a cinematic promotional video for https://www.connections.com/ using its actual website, images, branding, and services.`
3. Choose **Let the director pick shots**. The app captures the site (screens, card crops, logo, brand colours and font, pictures from the asset finder, headline/headings/CTAs/menu), then the director writes the product brief, picks a direction, maps the site's features to ShotCraft recipes and writes the storyboard. Read them.
4. **Approve & build film.** Each recipe's own Markdown card and TSX source are read, adapted to the captured site, checked against rendered frames, then reviewed. The chat states how many shots were adapted; the film is a draft until the independent review passes.
5. **Open in Motion Workbench**: every clip, text, image and sound is editable.
6. **Export video** (draft first). Rendering is in the browser.

Brand Kit and uploaded images are optional overrides only. When a site is given, the site names the film, supplies the logo and palette; Brand Kit never blocks or changes creation.

## Dev shortcut (no key entry in the UI)
`MS_LIVE_OPENAI_KEY=… npm run dev`, key exported in the shell only. Accepted only when `NODE_ENV !== 'production'` and for the dev bypass user; never written to disk or logged (last 4 characters shown as a hint).

## What to inspect
For each scene: is the site's own content (its pictures, words, logo, colours) inside the animation rather than an overlay? Does the camera move like the ShotCraft reference (`.claude/skills/video-shotcraft` card and the original TSX under `src/apps/motion-director/demosrc/`)? Does the sound land on the action?

## Handing it to Claude
Put the key in this container's environment (not in chat). Claude then runs exactly this flow in the real UI against the real model, captures key-stage screenshots and the exported MP4, and fixes only a scene that is wrong.
