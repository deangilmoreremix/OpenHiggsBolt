# Studio guides refresh — 2026-11-11

Every guide in `src/data/studioKnowledgeBase.json` was re-checked against the **current** studio component code (the previous text was generated 2026-09-21). Quoted on-screen labels are listed in `src/data/studioGuideLabels.json` and verified by `tests/studio-guide-labels.vitest.test.ts`, so a UI text change now fails a test and prompts a guide update. The assistant index (`src/data/helpIndex.json`) is checked for staleness by `tests/help-index-fresh.vitest.test.ts` (regenerate with `npm run build:help-index`).

Method: each studio's UI source (and the shared `muapi.js`/`models.js`) was read; steps, labels, limits and modes were kept only when found in code. Verification is by code review, **not** by clicking through each studio live (they need sign-in and a MuAPI key) — a human click-through of the high-churn studios (Motion Director, Storyboard, VFX, Video, Layers, Social Publishing) is still recommended.

New entries added: `edit`, `motion-control`, `zackd`, `apps`. Hard-coded model counts were removed except where counted from code and stated with their source.

## Per studio: what changed

### agents.changes (`agents.changes`)
- Old guide said 'Type a message or attach media' and listed attachments (image, video, audio); AgentStudio.jsx chat view has only a textarea and Send (lines 509-533), attachments are only passed as null in muapi.js sendAgentChatMessage. Removed attachment claims and the 'attachments' input.
- Old getting-started told users to customize instructions, knowledge and tools, add tools, and share the agent with team members; none of this exists in AgentStudio.jsx. Replaced with the real Create form (Name, Description, System Prompt, Welcome Message (optional), Create Agent) from messages/en/agentStudio.json and AgentStudio.jsx:384-448.
- Documented that card clicks and Create use router.push('/agents/<id>') / '/agents/create' (AgentStudio.jsx:206-224) which land on app/agents pages with a 'Back to Studio' link (app/agents/layout.js).
- Added tabs Templates / My Agents / My Chats and Create button (AgentStudio.jsx:167, 548-571), empty states, Retry, error strings, 5 minute reply wait (muapi.js pollAgentChatResult 150 x 2000 ms).
- Noted no edit/delete controls: AgentCard supports onEdit but AgentStudio.jsx:634-639 never passes it.
- Removed claim of 'Conversation history limited by backend storage' (not in code).
- _Not confirmable in code (left out or stated generally):_
  - The full-screen chat page (app/agents/[agent_id]) renders the ai-agent package component, whose source is not present in this checkout, so its exact buttons and placeholders were not confirmed; steps there are phrased generally.
  - The inline chat and create views in AgentStudio.jsx are driven by URL segments read from params.tab; this app mounts the studio at /studio/[[...slug]], so whether those inline views are ever shown here was not confirmed. Their labels are documented as 'in the chat view built into this studio'.
  - Which agents appear under Templates and what 'My Agents' contains is defined by MuAPI at runtime.

### Agents (`agents`)
- Old guide said 'Type a message or attach media' and listed attachments (image, video, audio); AgentStudio.jsx chat view has only a textarea and Send (lines 509-533), attachments are only passed as null in muapi.js sendAgentChatMessage. Removed attachment claims and the 'attachments' input.
- Old getting-started told users to customize instructions, knowledge and tools, add tools, and share the agent with team members; none of this exists in AgentStudio.jsx. Replaced with the real Create form (Name, Description, System Prompt, Welcome Message (optional), Create Agent) from messages/en/agentStudio.json and AgentStudio.jsx:384-448.
- Documented that card clicks and Create use router.push('/agents/<id>') / '/agents/create' (AgentStudio.jsx:206-224) which land on app/agents pages with a 'Back to Studio' link (app/agents/layout.js).
- Added tabs Templates / My Agents / My Chats and Create button (AgentStudio.jsx:167, 548-571), empty states, Retry, error strings, 5 minute reply wait (muapi.js pollAgentChatResult 150 x 2000 ms).
- Noted no edit/delete controls: AgentCard supports onEdit but AgentStudio.jsx:634-639 never passes it.
- Removed claim of 'Conversation history limited by backend storage' (not in code).
- _Not confirmable in code (left out or stated generally):_
  - The full-screen chat page (app/agents/[agent_id]) renders the ai-agent package component, whose source is not present in this checkout, so its exact buttons and placeholders were not confirmed; steps there are phrased generally.
  - The inline chat and create views in AgentStudio.jsx are driven by URL segments read from params.tab; this app mounts the studio at /studio/[[...slug]], so whether those inline views are ever shown here was not confirmed. Their labels are documented as 'in the chat view built into this studio'.
  - Which agents appear under Templates and what 'My Agents' contains is defined by MuAPI at runtime.

### ai-influencer.changes (`ai-influencer.changes`)
- Replaced 'hierarchical attribute builder' description with the real UI: Builder panel, Face/Body/Style tabs, 20 tile groups (AiInfluencerStudio.jsx:28-291; counted by reading TABS_CONFIG: 10 Face, 7 Body, 3 Style groups).
- Removed 'reference images' input: no upload control exists in the file.
- Removed the old 'text-to-image attribute builder' steps (eye color, hair style ...) in favour of tab/tile steps with exact labels from messages/en/aiInfluencerStudio.json.
- Added Shuffle (:472-481, :706-712), Reset (:601-614), aspect ratio buttons 3:4/1:1/9:16/16:9 default 3:4 (:387, :689-701), 'Generate Character' (messages toolbar.generate).
- Added warning that each group always has one tile selected, defaults come from the first option (:377-385) and groups like Horns/Eye Features/Skin Conditions have no 'none' option (:101-157).
- Added result actions: Save (.webp, :524-536,:754-760), Post to social (SocialPublishProvider.tsx:234), star assist button, Personalize (StandaloneShell.js:94-98).
- Added Generated history column (in memory only, :390-392, :848-935) and hover copy/download buttons.
- Added pills row with 'show more' / 'hide' after 7 pills (:587-588, :794-823), extra-details bar placeholder (messages customPrompt.placeholder), hand-off and template pre-fill (:424-450).
- Model: nano-banana-pro confirmed (:26, :496-500); prompt composition documented (:453-465).
- No paid-access gate in this studio's code (no requireEntitlement call), so none is stated.
- _Not confirmable in code (left out or stated generally):_
  - Whether nano-banana-pro 'consistency across generations' (old claim) holds: only a fixed model and prompt are visible in code; claim removed.
  - Exact error notification wording shown in the shell for failures (pushNotification in StandaloneShell.js); only the two formatErrorMessage strings are quoted.
  - The star-shaped button's label: AssistStep renders an icon only here; described as 'star button (assistant)' without a quoted label.
  - Cost per generation: no cost hint is shown in this studio's UI code.

### AI Influencer Studio (`ai-influencer`)
- Replaced 'hierarchical attribute builder' description with the real UI: Builder panel, Face/Body/Style tabs, 20 tile groups (AiInfluencerStudio.jsx:28-291; counted by reading TABS_CONFIG: 10 Face, 7 Body, 3 Style groups).
- Removed 'reference images' input: no upload control exists in the file.
- Removed the old 'text-to-image attribute builder' steps (eye color, hair style ...) in favour of tab/tile steps with exact labels from messages/en/aiInfluencerStudio.json.
- Added Shuffle (:472-481, :706-712), Reset (:601-614), aspect ratio buttons 3:4/1:1/9:16/16:9 default 3:4 (:387, :689-701), 'Generate Character' (messages toolbar.generate).
- Added warning that each group always has one tile selected, defaults come from the first option (:377-385) and groups like Horns/Eye Features/Skin Conditions have no 'none' option (:101-157).
- Added result actions: Save (.webp, :524-536,:754-760), Post to social (SocialPublishProvider.tsx:234), star assist button, Personalize (StandaloneShell.js:94-98).
- Added Generated history column (in memory only, :390-392, :848-935) and hover copy/download buttons.
- Added pills row with 'show more' / 'hide' after 7 pills (:587-588, :794-823), extra-details bar placeholder (messages customPrompt.placeholder), hand-off and template pre-fill (:424-450).
- Model: nano-banana-pro confirmed (:26, :496-500); prompt composition documented (:453-465).
- No paid-access gate in this studio's code (no requireEntitlement call), so none is stated.
- _Not confirmable in code (left out or stated generally):_
  - Whether nano-banana-pro 'consistency across generations' (old claim) holds: only a fixed model and prompt are visible in code; claim removed.
  - Exact error notification wording shown in the shell for failures (pushNotification in StandaloneShell.js); only the two formatErrorMessage strings are quoted.
  - The star-shaped button's label: AssistStep renders an icon only here; described as 'star button (assistant)' without a quoted label.
  - Cost per generation: no cost hint is shown in this studio's UI code.

### SmartVideo GO AI Apps (`apps`)
- NEW entry (id 'apps', label 'SmartVideo GO AI Apps', route /studio/apps): StandaloneShell.js:124,155,970 register the tab; app/studio/apps/page.js opens it.
- Documented hero and 'Open the Reseller Deployment Center' (AppsStudio.jsx:569-575 -> /reseller/deployment, :371).
- Documented the package cards, prices and CTAs from messages/en/appsStudio.json (packages.*) and Stripe Checkout links opening in a new tab (AppsStudio.jsx:15-18, :637-651).
- Documented the $400 upgrade button and its states (AppsStudio.jsx:496-530, :665-700).
- Documented 'How It Works' steps and the 'Reseller Setup Walkthrough' link to /academy/reseller/launch (AppsStudio.jsx:713-745).
- Documented search + category filter (AppsStudio.jsx:532-546, :749-780): 10 categories plus All, counted by reading the APPS array (38 apps; 37 with a hosted demo; 38 with a repo; 13 deployable-template per resellerDestinations.json). Counts are not hard-coded in the guide except the example 'Showing 12 of 38 applications' format; see unverified.
- Documented card buttons in order: 'Try Live Demo' (only when hosted), 'Deployment Guide' (/reseller/deployment#app-<id>), 'Source Code', 'Deploy on Vercel' (gated by vercelDeployEligibility), 'Learn How to Launch This App' (/academy/reseller/apps/<id>), and the 'GitHub' link (AppsStudio.jsx:906-1012, :374-406).
- Access facts from code: launch walkthrough and per-app workshop pages redirect to sign-in and show a locked panel unless canAccessTraining (app/academy/reseller/launch/page.tsx:34-42; src/lib/resellerAccess.ts:172-177 'exclusive to the $597 training package').
- _Not confirmable in code (left out or stated generally):_
  - The example text 'Showing 12 of 38 applications' uses the total (38) counted from the APPS array today; the total changes when apps are added, so the guide presents it only as a format example.
  - What the Reseller Deployment Center page contains in detail (app/reseller/deployment/page.js only renders the DeploymentCenter component; only its metadata description was read).
  - The contents of the 12-module walkthrough: only the page metadata description ('12-module guided course: choose an app, deploy it, connect Stripe, and start selling') was read.
  - Whether the package Stripe Checkout links are live for every visitor: the URLs are hard-coded in AppsStudio.jsx:15-18; the page also has a 'checkoutPending' message used only by the upgrade button when the upgrade endpoint answers 503.
  - Whether an unauthenticated visitor can open /studio/apps: the shell renders AppsStudio without a gate in this file, but sign-in handling happens elsewhere (not verified).
  - 'View App Details' string exists in the message file but is not rendered by AppsStudio.jsx, so it is not described.

### audio.changes (`audio.changes`)
- Model count: old said '17 audio models'; audioModels in packages/studio/src/models.js (lines 31842-35145) currently has 23 entries (counted by evaluating the array). Removed hard-coded count from the entry.
- Old guide described a 'model version (Suno V3.5-V5.5)' option; AudioStudio.jsx:836 skips any input with key 'model', so no version dropdown is shown and Suno defaults to V5. Removed.
- Old guide listed 'text prompt' as required for all models; models.js shows required lists differ (Suno Create Music requires only style; speech models require prompt and voice_id; remix/extend/voice-clone require audio_url).
- Old guide said ElevenLabs does voice cloning and a 'voice persona system'; code has persona_id/persona_model fields on Suno models only and cloning via Suno Voice Cloning and Minimax Voice Clone. Rewritten.
- Added real UI labels from messages/en/audioStudio.json: Audio Model, Generate Track, Generating Audio..., Now Playing, Save, New Generation, Generation History ({count}), Estimated cost.
- Documented upload behaviour: AudioStudio.jsx:102 uses getUploadLimit (uploadContract.js UPLOAD_LIMITS.audio = 10 MB) and uploadFile accepts audio/mpeg, audio/wav, audio/webm only; on-screen hint says 'MP3, WAV, M4A up to 20MB' and alert says 20MB (mismatch noted).
- Added Instrumental default on / Custom Mode default on (models.js suno-create-music defaults) and the lyrics hint.
- Added history (30 entries, AudioStudio.jsx:691), localStorage persistence (AudioStudio.jsx:607-642), poll limit 900 x 2s (muapi.js generateAudio -> submitAndPoll(...,900)).
- Removed the old 'Send to Lip Sync Studio' post-action and 'save voice personas' advice: not present in AudioStudio.jsx.
- _Not confirmable in code (left out or stated generally):_
  - Exact behaviour of list-style inputs (Dialogue Script, Speakers, Dialogue Turns): rendered as plain text boxes in code, whether the API accepts typed text there was not confirmed.
  - Whether the Estimated cost value is available for every model (depends on estimateModelCost at runtime).
  - Content of the 'Template loaded' banner flow from the landing page was not described beyond the Clear button.

### Audio Studio (`audio`)
- Model count: old said '17 audio models'; audioModels in packages/studio/src/models.js (lines 31842-35145) currently has 23 entries (counted by evaluating the array). Removed hard-coded count from the entry.
- Old guide described a 'model version (Suno V3.5-V5.5)' option; AudioStudio.jsx:836 skips any input with key 'model', so no version dropdown is shown and Suno defaults to V5. Removed.
- Old guide listed 'text prompt' as required for all models; models.js shows required lists differ (Suno Create Music requires only style; speech models require prompt and voice_id; remix/extend/voice-clone require audio_url).
- Old guide said ElevenLabs does voice cloning and a 'voice persona system'; code has persona_id/persona_model fields on Suno models only and cloning via Suno Voice Cloning and Minimax Voice Clone. Rewritten.
- Added real UI labels from messages/en/audioStudio.json: Audio Model, Generate Track, Generating Audio..., Now Playing, Save, New Generation, Generation History ({count}), Estimated cost.
- Documented upload behaviour: AudioStudio.jsx:102 uses getUploadLimit (uploadContract.js UPLOAD_LIMITS.audio = 10 MB) and uploadFile accepts audio/mpeg, audio/wav, audio/webm only; on-screen hint says 'MP3, WAV, M4A up to 20MB' and alert says 20MB (mismatch noted).
- Added Instrumental default on / Custom Mode default on (models.js suno-create-music defaults) and the lyrics hint.
- Added history (30 entries, AudioStudio.jsx:691), localStorage persistence (AudioStudio.jsx:607-642), poll limit 900 x 2s (muapi.js generateAudio -> submitAndPoll(...,900)).
- Removed the old 'Send to Lip Sync Studio' post-action and 'save voice personas' advice: not present in AudioStudio.jsx.
- _Not confirmable in code (left out or stated generally):_
  - Exact behaviour of list-style inputs (Dialogue Script, Speakers, Dialogue Turns): rendered as plain text boxes in code, whether the API accepts typed text there was not confirmed.
  - Whether the Estimated cost value is available for every model (depends on estimateModelCost at runtime).
  - Content of the 'Template loaded' banner flow from the landing page was not described beyond the Clear button.

### brand-studio.changes (`brand-studio.changes`)
- Corrected 'extracts brand DNA including industry and colors': POST /api/brands only reads the page title/site name and meta description for Brand Name and Tagline (app/api/brands/route.ts:90-118); other fields start empty and are editable on the Brand DNA page (brand/[id]/page.tsx).
- Replaced 'Recent brands list' with the left menu 'Brands' list (layout.tsx:96-155) and the mobile button row (:201-229).
- Added the three Analyze progress lines (brand-studio/page.tsx:12-16), 'Payment required to analyze brands' (:40-42) and the SmartVideo GO access check (:27).
- Added the full Brand DNA page structure: Core Identity, Voice & Personality, Colors, Fonts, Imagery Style, Save/Saved, hex-only colors (brand/[id]/page.tsx:172-300).
- Added the New Campaign page: six goals, 'Optional creative direction...', 'Generate 4 Concepts' (campaigns/new/page.tsx:6-83).
- Added the campaign page: concepts, 8 platform buttons, 'Generate Selected Assets (N)', progress strings, 'Generated Assets' (campaign/[id]/page.tsx:110-204); two platforms run in parallel (:90).
- Removed 'Animate integration': no Animate link exists in app/(brand-studio).
- Added that campaign concepts/assets use the user's saved OpenAI key (gpt-4o text, dall-e-3 images) (src/lib/campaignGenerator.ts:5,56; src/lib/assetGenerator.ts:5-6,139-150) instead of implying a MuAPI key.
- Added the in-memory brand store caveat (src/shared/brandStore.ts:1-30).
- Left the asset edit page (/asset/[id]/edit) out of the steps: no link to it exists in the studio pages (grep for '/asset/' found only the layout's route matching).
- _Not confirmable in code (left out or stated generally):_
  - Campaign generation reads the brand from the Supabase brand_dna table (src/lib/campaignGenerator.ts:15) while 'Analyze' stores brands in a server-memory store with ids like br_<timestamp> (app/api/brands/route.ts:122-130). I could not confirm that a brand created through 'Analyze' can be used for 'Generate 4 Concepts'; the guide only describes the UI and tells users to read the error message.
  - Asset edit page /asset/[id]/edit (Headline, Body, CTA, position grid, sizes, colors, Save Changes) exists but nothing in the studio links to it, so it is not documented in steps; its refresh icon button has no handler.
  - Whether the analysis ever fills Industry, colors or logo: the code path used by the New Brand page does not; a separate /api/brand/analyze route (analyzeBrand) exists but is not called by these pages.
  - The exact text of OpenAI-key error messages shown to the user in the concept pop-up (MissingOpenAiKeyError message is 'No OpenAI API key provided. Add your OpenAI key in Settings and try again.' but the pop-up wiring was not run).
  - Exact 'Personalize' window behaviour (shared personalization modal).

### Brand Studio (`brand-studio`)
- Corrected 'extracts brand DNA including industry and colors': POST /api/brands only reads the page title/site name and meta description for Brand Name and Tagline (app/api/brands/route.ts:90-118); other fields start empty and are editable on the Brand DNA page (brand/[id]/page.tsx).
- Replaced 'Recent brands list' with the left menu 'Brands' list (layout.tsx:96-155) and the mobile button row (:201-229).
- Added the three Analyze progress lines (brand-studio/page.tsx:11-15), 'Payment required to analyze brands' (:51) and the SmartVideo GO access check (:28).
- Added the full Brand DNA page structure: Core Identity, Voice & Personality, Colors, Fonts, Imagery Style, Save/Saved, hex-only colors (brand/[id]/page.tsx:204-300).
- Added the New Campaign page: six goals, 'Optional creative direction...', 'Generate 4 Concepts' (campaigns/new/page.tsx:6-83).
- Added the campaign page: concepts, 8 platform buttons, 'Generate Selected Assets (N)', progress strings, 'Generated Assets' (campaign/[id]/page.tsx:110-204); two platforms run in parallel (:100).
- Removed 'Animate integration': no Animate link exists in app/(brand-studio).
- Added that campaign concepts/assets use the user's saved OpenAI key (gpt-4o text, dall-e-3 images) (src/lib/campaignGenerator.ts:5,56; src/lib/assetGenerator.ts:5-6,139-150) instead of implying a MuAPI key.
- Added the in-memory brand store caveat (src/shared/brandStore.ts:1-30).
- Left the asset edit page (/asset/[id]/edit) out of the steps: no link to it exists in the studio pages (grep for '/asset/' found only the layout's route matching).
- _Not confirmable in code (left out or stated generally):_
  - Campaign generation reads the brand from the Supabase brand_dna table (src/lib/campaignGenerator.ts:15) while 'Analyze' stores brands in a server-memory store with ids like br_<timestamp> (app/api/brands/route.ts:122-130). I could not confirm that a brand created through 'Analyze' can be used for 'Generate 4 Concepts'; the guide only describes the UI and tells users to read the error message.
  - Asset edit page /asset/[id]/edit (Headline, Body, CTA, position grid, sizes, colors, Save Changes) exists but nothing in the studio links to it, so it is not documented in steps; its refresh icon button has no handler.
  - Whether the analysis ever fills Industry, colors or logo: the code path used by the New Brand page does not; a separate /api/brand/analyze route (analyzeBrand) exists but is not called by these pages.
  - The exact text of OpenAI-key error messages shown to the user in the concept pop-up (MissingOpenAiKeyError message is 'No OpenAI API key provided. Add your OpenAI key in Settings and try again.' but the pop-up wiring was not run).
  - Exact 'Personalize' window behaviour (shared personalization modal).

### cinema.changes (`cinema.changes`)
- Studio generates IMAGES via generateImage (CinemaStudio.jsx:847); old entry correctly says stills. Model chosen automatically: 'nano-banana-pro-edit' with a reference image else 'nano-banana-pro' (:848). Entry says there is no model picker.
- Generate button label is 'Shoot' (messages/en/cinemaStudio.json prompt.generate); disabled when prompt empty or generating (CinemaStudio.jsx:1418).
- Camera controls live in a 'Camera settings' overlay opened from the summary button (:1403-1413, :437-537): columns Camera/Lens/Focal length/Aperture; closes via Close button, Escape or backdrop click (:416-433).
- Counts computed now from CinemaStudio.jsx: CAMERA_MAP 6 keys, LENS_MAP 11 keys, focal lengths 8/14/24/35/50/85, apertures f/1.4,f/4,f/11, ASPECT_RATIOS 5, RESOLUTIONS 1K/2K/4K (:39-148). Defaults 16:9, 2K, Modular 8K Digital, Creative Tilt Lens, 35, f/1.4 (:572-580).
- ADDED: reference image upload (button, drag-drop, Library) at :1245-1325; upload failure only console.error (:619-621) so entry says failures are silent; upload limits from uploadContract.js (image 10MB, JPG/PNG/WEBP).
- ADDED: Library button (AssetLibraryButton, images) :1325; gallery actions copy prompt, copy image (needs HTTPS: :957-963), Download, Post to social, AI assist, Delete (:1013-1114); gallery keeps 50 (:873); download named cinema-shot-<id>.jpg (:1065).
- ADDED: storyboard hand-off (readStoryboardHandoff('cinema'), :682-705) and template banner (useTemplateData, :666-680), skill recipes at :637.
- REMOVED old outputDetails 'Send to Image Studio / Use in Storyboard' buttons: not in the studio. REMOVED invented businessImpact numbers.
- NOTE: Cinema Studio ignores droppedFiles (not destructured in props, CinemaStudio.jsx:541-563); entry mentions drag onto the picture button only.
- _Not confirmable in code (left out or stated generally):_
  - Exact visual effect of each camera/lens option: only a prompt-wording map exists in code; omitted.
  - Credit cost: no cost hint in this studio; omitted.
  - Whether the 'Close' text button is visible or only tooltip: title='Close' on an icon button (aria-label 'Close camera settings'); described as the Close button at top right.

### Cinema Studio (`cinema`)
- Studio generates IMAGES via generateImage (CinemaStudio.jsx:847); old entry correctly says stills. Model chosen automatically: 'nano-banana-pro-edit' with a reference image else 'nano-banana-pro' (:848). Entry says there is no model picker.
- Generate button label is 'Shoot' (messages/en/cinemaStudio.json prompt.generate); disabled when prompt empty or generating (CinemaStudio.jsx:1418).
- Camera controls live in a 'Camera settings' overlay opened from the summary button (:1403-1413, :437-537): columns Camera/Lens/Focal length/Aperture; closes via Close button, Escape or backdrop click (:416-433).
- Counts computed now from CinemaStudio.jsx: CAMERA_MAP 6 keys, LENS_MAP 11 keys, focal lengths 8/14/24/35/50/85, apertures f/1.4,f/4,f/11, ASPECT_RATIOS 5, RESOLUTIONS 1K/2K/4K (:39-148). Defaults 16:9, 2K, Modular 8K Digital, Creative Tilt Lens, 35, f/1.4 (:572-580).
- ADDED: reference image upload (button, drag-drop, Library) at :1245-1325; upload failure only console.error (:619-621) so entry says failures are silent; upload limits from uploadContract.js (image 10MB, JPG/PNG/WEBP).
- ADDED: Library button (AssetLibraryButton, images) :1325; gallery actions copy prompt, copy image (needs HTTPS: :957-963), Download, Post to social, AI assist, Delete (:1013-1114); gallery keeps 50 (:873); download named cinema-shot-<id>.jpg (:1065).
- ADDED: storyboard hand-off (readStoryboardHandoff('cinema'), :682-705) and template banner (useTemplateData, :666-680), skill recipes at :637.
- REMOVED old outputDetails 'Send to Image Studio / Use in Storyboard' buttons: not in the studio. REMOVED invented businessImpact numbers.
- NOTE: Cinema Studio ignores droppedFiles (not destructured in props, CinemaStudio.jsx:541-563); entry mentions drag onto the picture button only.
- _Not confirmable in code (left out or stated generally):_
  - Exact visual effect of each camera/lens option: only a prompt-wording map exists in code; omitted.
  - Credit cost: no cost hint in this studio; omitted.
  - Whether the 'Close' text button is visible or only tooltip: title='Close' on an icon button (aria-label 'Close camera settings'); described as the Close button at top right.

### clipping.changes (`clipping.changes`)
- REMOVED claims not in code: captions / hook-first framing, "Edit in VFX Studio", "Import into timeline", "Download clips as a package", pre-trim under 30 minutes advice, engagement-signal model description (ClippingStudio.jsx; muapi.js:1077-1085 sends only video_url, num_highlights, aspect_ratio, return_coordinates_only).
- FIXED aspect ratios: old entry gave no list; code offers 9:16, 16:9, 1:1, 4:5, 4:3, 3:4, default 9:16 (ClippingStudio.jsx:254, 314-321).
- FIXED highlight count: slider 1 to 60, default 3, in a popover titled Max Highlights with Limit: (ClippingStudio.jsx:1233-1250). Old entry said "backend-dependent maximum".
- ADDED 100 MB upload limit and rejection behaviour (ClippingStudio.jsx:41, 533-537; en/clippingStudio.json errors.videoExceedsLimit).
- ADDED three ways to supply the video: upload button (tooltip Upload source video), drag onto it, Saved library button (new shared asset library, ClippingStudio.jsx:1153; AssetLibraryButton.jsx), and pasting an http(s) link into the text box which is moved into the source slot (handlePromptInput, ClippingStudio.jsx:519-527).
- ADDED that the bottom text box text is NOT sent to the API (handleGenerate params, ClippingStudio.jsx:614-619).
- ADDED result views: Clips Gallery Mode vs Timeline Seek Mode (Highlights Timeline, Original Video Player, Seek & Play), Back to History, Clipping History Runs (max 30, local storage) (ClippingStudio.jsx:653, 746-1066).
- ADDED hover actions on clips: Copy Link, Download (.mp4), post button with tooltip Post this to a social network, mobile actions menu (ClippingStudio.jsx:975-1033; SocialPublishProvider.tsx:227).
- ADDED placeholder coordinates behaviour: when Coordinates Only returns nothing, the UI fills 15-second Highlight #n entries (ClippingStudio.jsx:637-647).
- ADDED alert text when no video is set (en/clippingStudio.json alerts.needVideo).
- _Not confirmable in code (left out or stated generally):_
  - Whether pasted links to web pages (for example YouTube watch pages) are accepted by the ai-clipping service: not determinable from code; guide says to use a direct video file link.
  - Maximum video length or duration the service accepts: not in code.
  - Credit cost of a clipping run: no cost hint in the UI code.
  - Click on a clip card sets fullscreenUrl but no code renders a fullscreen player; guide therefore says clicking does not open a bigger view.
  - Exact label of the Assist (sparkle) button on clip cards: icon-only, not described.

### AI Clipping (`clipping`)
- REMOVED claims not in code: captions / hook-first framing, "Edit in VFX Studio", "Import into timeline", "Download clips as a package", pre-trim under 30 minutes advice, engagement-signal model description (ClippingStudio.jsx; muapi.js:1077-1085 sends only video_url, num_highlights, aspect_ratio, return_coordinates_only).
- FIXED aspect ratios: old entry gave no list; code offers 9:16, 16:9, 1:1, 4:5, 4:3, 3:4, default 9:16 (ClippingStudio.jsx:254, 314-321).
- FIXED highlight count: slider 1 to 60, default 3, in a popover titled Max Highlights with Limit: (ClippingStudio.jsx:1233-1250). Old entry said "backend-dependent maximum".
- ADDED 100 MB upload limit and rejection behaviour (ClippingStudio.jsx:41, 533-537; en/clippingStudio.json errors.videoExceedsLimit).
- ADDED three ways to supply the video: upload button (tooltip Upload source video), drag onto it, Saved library button (new shared asset library, ClippingStudio.jsx:1153; AssetLibraryButton.jsx), and pasting an http(s) link into the text box which is moved into the source slot (handlePromptInput, ClippingStudio.jsx:519-527).
- ADDED that the bottom text box text is NOT sent to the API (handleGenerate params, ClippingStudio.jsx:614-619).
- ADDED result views: Clips Gallery Mode vs Timeline Seek Mode (Highlights Timeline, Original Video Player, Seek & Play), Back to History, Clipping History Runs (max 30, local storage) (ClippingStudio.jsx:653, 746-1066).
- ADDED hover actions on clips: Copy Link, Download (.mp4), post button with tooltip Post this to a social network, mobile actions menu (ClippingStudio.jsx:975-1033; SocialPublishProvider.tsx:227).
- ADDED placeholder coordinates behaviour: when Coordinates Only returns nothing, the UI fills 15-second Highlight #n entries (ClippingStudio.jsx:637-647).
- ADDED alert text when no video is set (en/clippingStudio.json alerts.needVideo).
- _Not confirmable in code (left out or stated generally):_
  - Whether pasted links to web pages (for example YouTube watch pages) are accepted by the ai-clipping service: not determinable from code; guide says to use a direct video file link.
  - Maximum video length or duration the service accepts: not in code.
  - Credit cost of a clipping run: no cost hint in the UI code.
  - Click on a clip card sets fullscreenUrl but no code renders a fullscreen player; guide therefore says clicking does not open a bigger view.
  - Exact label of the Assist (sparkle) button on clip cards: icon-only, not described.

### design-agent.changes (`design-agent.changes`)
- Template count: old said 33; TEMPLATES in src/apps/design-agent/DesignAgent.tsx:92-123 has 30 entries (counted by regex). Entry now says 30 and lists them.
- Old guide said projects/messages persist; DesignAgent.tsx:785 reopening a project calls setMessages([]), only the project list (localStorage go_ai_design_agent_projects) and Brand Kit persist. Corrected.
- Old guide described 'Attach reference images'; code accepts image/video/audio, max 14 (DesignAgent.tsx:80,411), with limits from uploadContract.js (image 10 MB, video 50 MB, audio 10 MB) and unsupported types skipped (line 427).
- Added plan approval flow (PlanCard in ui.tsx:244, handlePlanAction DesignAgent.tsx:651) with exact buttons 'Approve & Generate' / 'Reject / Revise' and prefilled 'Revise the plan: '.
- Added asset viewer buttons (DesignAgent.tsx:211-238): Edit with Go-AI, Upscale, Remove BG, Vectorize, Download, Enhance, and 'Post to social' (SocialPublishProvider.tsx).
- Added mode pills (lowercase agent/generate/edit, DesignAgent.tsx:289), Brand Kit dialog fields and placeholders, home screen labels and Recent Projects (max 8).
- Added paid-access gate (requireEntitlement ENTITLEMENTS.SMARTVIDEO_GO) and its on-screen messages; removed old 'check MuAPI and OpenAI keys' advice (no OpenAI key use in DesignAgent.tsx).
- Removed old inputs 'asset action (edit, upscale...)' as a separate input and 'Save projects to localStorage' step.
- _Not confirmable in code (left out or stated generally):_
  - What Enhance does after click: it opens AssistStep from AiAssistantProvider, not read in detail.
  - The 'Post to social' dialog contents were not reviewed.
  - Which tools Go-AI uses and credit amounts come from the backend at runtime.

### Design Agent AI (`design-agent`)
- Template count: old said 33; TEMPLATES in src/apps/design-agent/DesignAgent.tsx:92-123 has 30 entries (counted by regex). Entry now says 30 and lists them.
- Old guide said projects/messages persist; DesignAgent.tsx:785 reopening a project calls setMessages([]), only the project list (localStorage go_ai_design_agent_projects) and Brand Kit persist. Corrected.
- Old guide described 'Attach reference images'; code accepts image/video/audio, max 14 (DesignAgent.tsx:80,411), with limits from uploadContract.js (image 10 MB, video 50 MB, audio 10 MB) and unsupported types skipped (line 427).
- Added plan approval flow (PlanCard in ui.tsx:244, handlePlanAction DesignAgent.tsx:651) with exact buttons 'Approve & Generate' / 'Reject / Revise' and prefilled 'Revise the plan: '.
- Added asset viewer buttons (DesignAgent.tsx:211-238): Edit with Go-AI, Upscale, Remove BG, Vectorize, Download, Enhance, and 'Post to social' (SocialPublishProvider.tsx).
- Added mode pills (lowercase agent/generate/edit, DesignAgent.tsx:289), Brand Kit dialog fields and placeholders, home screen labels and Recent Projects (max 8).
- Added paid-access gate (requireEntitlement ENTITLEMENTS.SMARTVIDEO_GO) and its on-screen messages; removed old 'check MuAPI and OpenAI keys' advice (no OpenAI key use in DesignAgent.tsx).
- Removed old inputs 'asset action (edit, upscale...)' as a separate input and 'Save projects to localStorage' step.
- Reviewer fix: 'paid plan' wording replaced; resolveAccess.ts:127 grants base SmartVideo GO access to every signed-in user.
- _Not confirmable in code (left out or stated generally):_
  - What Enhance does after click: it opens AssistStep from AiAssistantProvider, not read in detail.
  - The 'Post to social' dialog contents were not reviewed.
  - Which tools Go-AI uses and credit amounts come from the backend at runtime.

### edit.changes (`edit.changes`)
- NEW entry: no 'edit' studio existed in studioKnowledgeBase.json. Source: packages/studio/src/components/edit/*, editTools.js, tab id 'edit' at components/StandaloneShell.js:103,944.
- Tool count 14 computed by counting entries in EDIT_TOOLS (editTools.js, slugs listed there); commit 4342112 also says 14.
- Upload box labels from editToolRunner.js:getEditToolSlots (e.g. 'Start frame' :58, 'Portrait image' :91, 'Audio track' :95, 'Motion reference video' :99).
- Saved button label 'Saved' from EditToolPlayground.jsx:169 (AssetLibraryButton label prop; popover title 'Your library').
- No file-size limit stated: handleFiles (EditToolPlayground.jsx:240) only checks MIME type via isAllowedUploadMimeType.
- _Not confirmable in code (left out or stated generally):_
  - Upload size limits for Edit Studio not found in the screen code (uploadFile in muapi.js may enforce its own); left out.
  - Which exact models appear per tool was not enumerated (they come from models.js filters); described generally.
  - Credit/cost is not shown anywhere in this UI; not mentioned.
  - Exact pricing, speed and per-model supported durations not stated.

### Edit Studio (`edit`)
- NEW entry: no 'edit' studio existed in studioKnowledgeBase.json. Source: packages/studio/src/components/edit/*, editTools.js, tab id 'edit' at components/StandaloneShell.js:103,944.
- Tool count 14 computed by counting entries in EDIT_TOOLS (editTools.js, slugs listed there); commit 4342112 also says 14.
- Upload box labels from editToolRunner.js:getEditToolSlots (e.g. 'Start frame' :58, 'Portrait image' :91, 'Audio track' :95, 'Motion reference video' :99).
- Saved button label 'Saved' from EditToolPlayground.jsx:169 (AssetLibraryButton label prop; popover title 'Your library').
- No file-size limit stated: handleFiles (EditToolPlayground.jsx:240) only checks MIME type via isAllowedUploadMimeType.
- _Not confirmable in code (left out or stated generally):_
  - Upload size limits for Edit Studio not found in the screen code (uploadFile in muapi.js may enforce its own); left out.
  - Which exact models appear per tool was not enumerated (they come from models.js filters); described generally.
  - Credit/cost is not shown anywhere in this UI; not mentioned.
  - Exact pricing, speed and per-model supported durations not stated.

### go-ai-viral.changes (`go-ai-viral.changes`)
- Removed 'media type filter (all, image, video)' from inputs and steps: state exists (GoAiViralStudio.tsx:1011) but no sidebar control sets it; only the empty-state 'Clear all filters' resets it (:1607).
- Added the three header buttons Feed / Video Prompts / Academy (:1316-1342) and the Video Prompts view with Availability and Source Language filters (:1379-1408, :1540-1565).
- Corrected sort option names to 'Newest first' / 'Oldest first' (:1421, :1428) and added Categories, Recommended Model, View (grid/list) groups (:1433-1538).
- Documented card actions 'View details', 'Open Source', 'View Prompt', 'Personalize This Demo', 'Create This Style' (PromptCard :216-266; DemoTemplateActions.tsx:4-8).
- Documented Prompt Details window: 'Copy', 'Copied!', 'View on X', 'Open in Studio', 'Copy Prompt', 'Open on X' (:723-928) and Video Prompt window (:504-580).
- Documented 'Open in...' picker and its target lists: image -> Image Studio, Thumbnail Studio, AI Influencer Studio, Marketing Studio (crossStudio.ts:186-189,:92-104); video -> Video Studio, Cinema Studio (crossStudio.ts:196-199; StudioTargetPicker.tsx:51-65).
- Added access note exactly as seen in code: GoViralGate shows 'GO-Viral is sold separately' / 'Unlock GO-Viral' for accounts without it (GoViralGate.tsx:30-52).
- Added paging (30 per page, infinite scroll, '— End of feed —'), empty and error states (:1018, :1576-1641, :1744-1753); noted browsing needs no key (:1001).
- Removed 'prompt count depends on CDN' style limitation phrasing and 'machine-readable datasets' marketing text; kept source attribution facts (header comment and Curation block :884-897).
- _Not confirmable in code (left out or stated generally):_
  - Academy button: studioMode 'academy' is set (:1334-1342) but this file renders no academy-specific content (the main area falls to the video-card grid); the guide tells users to use /academy instead and does not promise content.
  - What 'Personalize This Demo' does in detail (handled by useDemoPersonalize / personalization modal outside this file).
  - What happens inside the target studio after hand-off beyond 'prompt pre-filled' (verified for Thumbnail Studio and AI Influencer Studio only).
  - How the account unlock/purchase flow works after clicking 'Unlock GO-Viral' (openUpgradeModal in SmartVideoAccessProvider; not described).
  - Exact prompt count and category/model lists: they come from /api/go-ai-viral/prompts at runtime.

### GO-Viral (`go-ai-viral`)
- Removed 'media type filter (all, image, video)' from inputs and steps: state exists (GoAiViralStudio.tsx:1011) but no sidebar control sets it; only the empty-state 'Clear all filters' resets it (:1607).
- Added the three header buttons Feed / Video Prompts / Academy (:1316-1342) and the Video Prompts view with Availability and Source Language filters (:1379-1408, :1540-1565).
- Corrected sort option names to 'Newest first' / 'Oldest first' (:1421, :1428) and added Categories, Recommended Model, View (grid/list) groups (:1433-1538).
- Documented card actions 'View details', 'Open Source', 'View Prompt', 'Personalize This Demo', 'Create This Style' (PromptCard :216-266; DemoTemplateActions.tsx:4-8).
- Documented Prompt Details window: 'Copy', 'Copied!', 'View on X', 'Open in Studio', 'Copy Prompt', 'Open on X' (:723-928) and Video Prompt window (:504-580).
- Documented 'Open in...' picker and its target lists: image -> Image Studio, Thumbnail Studio, AI Influencer Studio, Marketing Studio (crossStudio.ts:186-189,:92-104); video -> Video Studio, Cinema Studio (crossStudio.ts:196-199; StudioTargetPicker.tsx:51-65).
- Added access note exactly as seen in code: GoViralGate shows 'GO-Viral is sold separately' / 'Unlock GO-Viral' for accounts without it (GoViralGate.tsx:30-52).
- Added paging (30 per page, infinite scroll, '— End of feed —'), empty and error states (:1018, :1576-1641, :1744-1753); noted browsing needs no key (:1001).
- Removed 'prompt count depends on CDN' style limitation phrasing and 'machine-readable datasets' marketing text; kept source attribution facts (header comment and Curation block :884-897).
- _Not confirmable in code (left out or stated generally):_
  - Academy button: studioMode 'academy' is set (:1334-1342) but this file renders no academy-specific content (the main area falls to the video-card grid); the guide tells users to use /academy instead and does not promise content.
  - What 'Personalize This Demo' does in detail (handled by useDemoPersonalize / personalization modal outside this file).
  - What happens inside the target studio after hand-off beyond 'prompt pre-filled' (verified for Thumbnail Studio and AI Influencer Studio only).
  - How the account unlock/purchase flow works after clicking 'Unlock GO-Viral' (openUpgradeModal in SmartVideoAccessProvider; not described).
  - Exact prompt count and category/model lists: they come from /api/go-ai-viral/prompts at runtime.

### image.changes (`image.changes`)
- Old steps referenced a mode selector (text-to-image / image-to-image / inpainting), 'strength slider' and 'seed': none exist in ImageStudio.jsx (grep for strength/seed/inpaint finds nothing in the component). Mode is implicit: imageMode set when reference images are added (handleUploadSelect, ImageStudio.jsx ~1210).
- Removed hard-coded counts '72 T2I / 74 I2I models' and '131/90 ...' (not recomputed).
- Reference upload limit: 10MB per file (MAX_IMAGE_SIZE ImageStudio.jsx ~211 and ~1139); old '14 images' claim removed because the cap is per model (getMaxImagesForI2IModel / media capabilities).
- Added batch size 1-4 (n/4 stepper), Draw (DrawModal), Recipes -> /studio/skills, Library button (AssetLibraryButton, added in c43e7e6), Swap Face upload, Effect Type, PARAMS button.
- Model picker tabs All / Text to Image / Image to Image, provider icons, 'Search models...' (messages/en/imageStudio.json modelDropdown).
- Gallery: click for fullscreen, hover actions Download/Delete(with confirm), local history keeps 50 (addToHistory slice(0,49)).
- _Not confirmable in code (left out or stated generally):_
  - Per-model limits (aspect ratios, resolutions, reference image count) not enumerated.
  - The exact default model name is not stated (first entry of t2iModels).
  - Behaviour of the Personalize button (injected by the app) not described.

### Image Studio (`image`)
- Old steps referenced a mode selector (text-to-image / image-to-image / inpainting), 'strength slider' and 'seed': none exist in ImageStudio.jsx (grep for strength/seed/inpaint finds nothing in the component). Mode is implicit: imageMode set when reference images are added (handleUploadSelect, ImageStudio.jsx ~1210).
- Removed hard-coded counts '72 T2I / 74 I2I models' and '131/90 ...' (not recomputed).
- Reference upload limit: 10MB per file (MAX_IMAGE_SIZE ImageStudio.jsx ~211 and ~1139); old '14 images' claim removed because the cap is per model (getMaxImagesForI2IModel / media capabilities).
- Added batch size 1-4 (n/4 stepper), Draw (DrawModal), Recipes -> /studio/skills, Library button (AssetLibraryButton, added in c43e7e6), Swap Face upload, Effect Type, PARAMS button.
- Model picker tabs All / Text to Image / Image to Image, provider icons, 'Search models...' (messages/en/imageStudio.json modelDropdown).
- Gallery: click for fullscreen, hover actions Download/Delete(with confirm), local history keeps 50 (addToHistory slice(0,49)).
- _Not confirmable in code (left out or stated generally):_
  - Per-model limits (aspect ratios, resolutions, reference image count) not enumerated.
  - The exact default model name is not stated (first entry of t2iModels).
  - Behaviour of the Personalize button (injected by the app) not described.

### layers.changes (`layers.changes`)
- Old howToSteps ended with 'Click Process': no Process button exists. Actual per-tool action buttons: footer in LayersStudio.jsx ~lines 4040-4170 (Separate layers / Upscale / Remove Background 1.0 / Expand Image 0.03; Color Grading footer has reset-all, Download, Post to social).
- Old entry said 'Image-to-image generation' mode and 'output format'/'upscale factor' inputs: no I2I panel or output-format control exists; quick edits (Edit text, Enhancer, Relight, Angles) are in sideMenuItems (LayersStudio.jsx ~1985) and use generateI2I with 'nano-banana-pro-edit' (handleExecuteSideTool).
- Added Color Grading (7 sections, Download, Post to social), Layer Carousel, Lasso/Regional edit, Marker/Eraser/Shapes, Saved button (asset library), sample image/layers preloaded (DEFAULT_SAMPLE_IMAGE).
- Upscale options verified: Topaz [1,2,4,8], SeedVR2 ['2k','4k','8k'], AI Upscaler none (LayersStudio.jsx ~2600-2780); Layers slider min 2 max 16 default 8; Resolution 1K/1.5K/2K default 1K.
- Upload: 20MB limit and image-only (handleFiles ~313-331); dropzone text 'Supports PNG, JPEG, WEBP up to 20MB'.
- Removed claims 'Drawing tools preset color palette ... drawing annotations as inputs': drawings are an overlay only; Shapes drags and Lasso/Regional boxes become marked regions used in decomposition prompt (buildSeedreamLayerPrompt).
- _Not confirmable in code (left out or stated generally):_
  - Costs shown on buttons (1.0, 0.03, 0.02) are hard-coded labels in the UI; what they bill was not verified, so not described as credits.
  - Whether the Seedream layer service really returns the requested number of layers not verifiable in code.
  - The panel close button has no reopen control in the code (setIsSidebarOpen only set to false); advised reload.

### Layers Studio (`layers`)
- Old howToSteps ended with 'Click Process': no Process button exists. Actual per-tool action buttons: footer in LayersStudio.jsx ~lines 4040-4170 (Separate layers / Upscale / Remove Background 1.0 / Expand Image 0.03; Color Grading footer has reset-all, Download, Post to social).
- Old entry said 'Image-to-image generation' mode and 'output format'/'upscale factor' inputs: no I2I panel or output-format control exists; quick edits (Edit text, Enhancer, Relight, Angles) are in sideMenuItems (LayersStudio.jsx ~1985) and use generateI2I with 'nano-banana-pro-edit' (handleExecuteSideTool).
- Added Color Grading (7 sections, Download, Post to social), Layer Carousel, Lasso/Regional edit, Marker/Eraser/Shapes, Saved button (asset library), sample image/layers preloaded (DEFAULT_SAMPLE_IMAGE).
- Upscale options verified: Topaz [1,2,4,8], SeedVR2 ['2k','4k','8k'], AI Upscaler none (LayersStudio.jsx ~2600-2780); Layers slider min 2 max 16 default 8; Resolution 1K/1.5K/2K default 1K.
- Upload: 20MB limit and image-only (handleFiles ~313-331); dropzone text 'Supports PNG, JPEG, WEBP up to 20MB'.
- Removed claims 'Drawing tools preset color palette ... drawing annotations as inputs': drawings are an overlay only; Shapes drags and Lasso/Regional boxes become marked regions used in decomposition prompt (buildSeedreamLayerPrompt).
- _Not confirmable in code (left out or stated generally):_
  - Costs shown on buttons (1.0, 0.03, 0.02) are hard-coded labels in the UI; what they bill was not verified, so not described as credits.
  - Whether the Seedream layer service really returns the requested number of layers not verifiable in code.
  - The panel close button has no reopen control in the code (setIsSidebarOpen only set to false); advised reload.

### lipsync.changes (`lipsync.changes`)
- OLD said 'avatar mode' as a third generation mode: code has only two modes, 'Portrait Image' and 'Video' (LipSyncStudio.jsx:1168,1179; messages/en/lipSyncStudio.json modes). Kling avatar models and Omnihuman are listed inside Portrait Image mode (models.js category 'image').
- OLD claimed 'Video-based lipsync modes (lite/basic)' and 'Seed control' as user features: no control for Volcengine mode or seed exists in the UI (seed is always -1 when a model has hasSeed; LipSyncStudio.jsx:896). Removed.
- OLD claimed 'Cross-studio handoff from storyboard': no storyboard handoff code in LipSyncStudio.jsx. Removed.
- OLD said generate button 'Generate': actual label is 'Sync Lip' (messages/en/lipSyncStudio.json actions.generate).
- OLD said 'Resolution options 480p-1080p' for all: resolution button only shown when model has inputs.resolution (LipSyncStudio.jsx:687,1350); only Infinite Talk, Wan 2.2, Infinite Talk V2V (480p/720p) and two LTX models (480p/720p/1080p) have it (models.js ~31467-31660).
- OLD model count '14': computed now from models.js lipsyncModels = 15 entries (9 category image, 6 category video); count removed from entry text.
- OLD said 'Infinite Talk and Wan 2.2 are strong general-purpose choices' / quality claims: not code-verifiable; removed.
- ADDED limits from code: image 10MB, video 50MB, audio 10MB (LipSyncStudio.jsx:706,733,764; messages errors); upload MIME allowlist (uploadContract.js UPLOAD_MIME_TYPES; muapi.js uploadFile rejects other types with 'Invalid file type').
- ADDED: mode switch clears the other mode's upload and resets model (LipSyncStudio.jsx:809-833); prompt only sent when model hasPrompt (:894); text placeholder 'Describe speech style...'.
- ADDED: Library button (AssetLibraryButton, tabs Images/Audio or Videos/Audio) at LipSyncStudio.jsx:1278; drag-and-drop behaviour :788-806; gallery keeps 30 results (:848), hover actions (:1009-1060).
- REMOVED old outputDetails 'Send to Video Studio / Edit in VFX Studio / Send to Marketing Studio': no such buttons in the studio.
- REMOVED fabricated businessImpact figures ($10,000 saved, 25 percent growth, etc.) and invented workflow claims from old useCases.
- Shell tab label is 'Lip Sync' (components/StandaloneShell.js:108); studio opened at /studio/lipsync (handleTabChange pushes /studio/<tab>).
- _Not confirmable in code (left out or stated generally):_
  - Audio length limit per model: not shown in code; phrased generally.
  - Per-model quality/behaviour differences and which model suits which audio: not in code; omitted.
  - Credit cost: no cost hint in this studio; omitted.
  - Whether audio/x-wav (reported by some browsers) is accepted: allowlist lists audio/wav only; left as 'MP3, WAV and WEBM'.

### Lip Sync Studio (`lipsync`)
- OLD said 'avatar mode' as a third generation mode: code has only two modes, 'Portrait Image' and 'Video' (LipSyncStudio.jsx:1168,1179; messages/en/lipSyncStudio.json modes). Kling avatar models and Omnihuman are listed inside Portrait Image mode (models.js category 'image').
- OLD claimed 'Video-based lipsync modes (lite/basic)' and 'Seed control' as user features: no control for Volcengine mode or seed exists in the UI (seed is always -1 when a model has hasSeed; LipSyncStudio.jsx:896). Removed.
- OLD claimed 'Cross-studio handoff from storyboard': no storyboard handoff code in LipSyncStudio.jsx. Removed.
- OLD said generate button 'Generate': actual label is 'Sync Lip' (messages/en/lipSyncStudio.json actions.generate).
- OLD said 'Resolution options 480p-1080p' for all: resolution button only shown when model has inputs.resolution (LipSyncStudio.jsx:687,1350); only Infinite Talk, Wan 2.2, Infinite Talk V2V (480p/720p) and two LTX models (480p/720p/1080p) have it (models.js ~31467-31660).
- OLD model count '14': computed now from models.js lipsyncModels = 15 entries (9 category image, 6 category video); count removed from entry text.
- OLD said 'Infinite Talk and Wan 2.2 are strong general-purpose choices' / quality claims: not code-verifiable; removed.
- ADDED limits from code: image 10MB, video 50MB, audio 10MB (LipSyncStudio.jsx:706,733,764; messages errors); upload MIME allowlist (uploadContract.js UPLOAD_MIME_TYPES; muapi.js uploadFile rejects other types with 'Invalid file type').
- ADDED: mode switch clears the other mode's upload and resets model (LipSyncStudio.jsx:809-833); prompt only sent when model hasPrompt (:894); text placeholder 'Describe speech style...'.
- ADDED: Library button (AssetLibraryButton, tabs Images/Audio or Videos/Audio) at LipSyncStudio.jsx:1278; drag-and-drop behaviour :788-806; gallery keeps 30 results (:848), hover actions (:1009-1060).
- REMOVED old outputDetails 'Send to Video Studio / Edit in VFX Studio / Send to Marketing Studio': no such buttons in the studio.
- REMOVED fabricated businessImpact figures ($10,000 saved, 25 percent growth, etc.) and invented workflow claims from old useCases.
- Shell tab label is 'Lip Sync' (components/StandaloneShell.js:108); studio opened at /studio/lipsync (handleTabChange pushes /studio/<tab>).
- _Not confirmable in code (left out or stated generally):_
  - Audio length limit per model: not shown in code; phrased generally.
  - Per-model quality/behaviour differences and which model suits which audio: not in code; omitted.
  - Credit cost: no cost hint in this studio; omitted.
  - Whether audio/x-wav (reported by some browsers) is accepted: allowlist lists audio/wav only; left as 'MP3, WAV and WEBM'.

### marketing.changes (`marketing.changes`)
- Generate button is 'Launch' (messages/en/marketingStudio.json buttons.launch); script and product image are required, with popups 'Please enter an ad script.' / 'Please upload a product image.' (MarketingStudio.jsx:486-487).
- Script placeholder quotes @image1 product / @image2 avatar (messages prompt.placeholder); images_list is [product, avatar, ...references] filtered, so a missing avatar shifts numbering (:497).
- Options computed from code: ratios 9:16,3:4,4:3,16:9,1:1; res 720p,1080p; durations 4..15 (:118-122); defaults 9:16, 1080p, 5s, format UGC (:357-363).
- Formats: UGC, Tutorial, Unboxing, Hyper Motion, Product Review, TV Spot (:108-115); avatars Priya, Elena, Kai, Sora, Minji, Margot, Niko, Jin (:98-107). Preset video is sent as video_files (:498).
- Resolution picks the route: 1080p -> 'sd-2-vip-omni-reference-1080p' else 'seedance-2-vip-omni-reference' (muapi.js:223-233). Resolution is not otherwise sent; no model picker.
- ADDED: three upload slots (Product/Avatar/References, tooltips 'Upload Product' etc.), references capped at 6 (:466), reference thumbnails removable (:686-699), 'Saved' library button fills product>avatar>references (:759-767), avatar preview with 'Enlarge preview'/'Select Avatar' (:246-262, :1058-1069).
- ADDED: finished ad opens full screen automatically (:512); gallery actions copy prompt, Download (marketing-ad-<id>.mp4), Post to social, AI assist, Delete (:546-596); recent ads stored in browser.
- Upload failures show browser alert(err.message) (:472,:480); size/type limits from uploadContract.js (images 10MB, JPG/PNG/WEBP).
- REMOVED anything about CTA/avatars as marketing claims, invented businessImpact numbers, and 'Send to ...' post actions that do not exist in the studio.
- NOTE: MarketingStudio receives droppedFiles but never uses it (:323,:342 only destructured), so entry mentions drag onto the slot buttons only.
- _Not confirmable in code (left out or stated generally):_
  - What each format preset changes in the output: only the sample video is sent; effect not described in code.
  - Credit cost: no cost hint in this studio; omitted.
  - How the 720p route differs in quality from 1080p: only the endpoint name differs in code.

### Marketing Studio (`marketing`)
- Generate button is 'Launch' (messages/en/marketingStudio.json buttons.launch); script and product image are required, with popups 'Please enter an ad script.' / 'Please upload a product image.' (MarketingStudio.jsx:486-487).
- Script placeholder quotes @image1 product / @image2 avatar (messages prompt.placeholder); images_list is [product, avatar, ...references] filtered, so a missing avatar shifts numbering (:497).
- Options computed from code: ratios 9:16,3:4,4:3,16:9,1:1; res 720p,1080p; durations 4..15 (:118-122); defaults 9:16, 1080p, 5s, format UGC (:357-363).
- Formats: UGC, Tutorial, Unboxing, Hyper Motion, Product Review, TV Spot (:108-115); avatars Priya, Elena, Kai, Sora, Minji, Margot, Niko, Jin (:98-107). Preset video is sent as video_files (:498).
- Resolution picks the route: 1080p -> 'sd-2-vip-omni-reference-1080p' else 'seedance-2-vip-omni-reference' (muapi.js:223-233). Resolution is not otherwise sent; no model picker.
- ADDED: three upload slots (Product/Avatar/References, tooltips 'Upload Product' etc.), references capped at 6 (:466), reference thumbnails removable (:686-699), 'Saved' library button fills product>avatar>references (:759-767), avatar preview with 'Enlarge preview'/'Select Avatar' (:246-262, :1058-1069).
- ADDED: finished ad opens full screen automatically (:512); gallery actions copy prompt, Download (marketing-ad-<id>.mp4), Post to social, AI assist, Delete (:546-596); recent ads stored in browser.
- Upload failures show browser alert(err.message) (:472,:480); size/type limits from uploadContract.js (images 10MB, JPG/PNG/WEBP).
- REMOVED anything about CTA/avatars as marketing claims, invented businessImpact numbers, and 'Send to ...' post actions that do not exist in the studio.
- NOTE: MarketingStudio receives droppedFiles but never uses it (:323,:342 only destructured), so entry mentions drag onto the slot buttons only.
- _Not confirmable in code (left out or stated generally):_
  - What each format preset changes in the output: only the sample video is sent; effect not described in code.
  - Credit cost: no cost hint in this studio; omitted.
  - How the 720p route differs in quality from 1080p: only the endpoint name differs in code.

### motion-control.changes (`motion-control.changes`)
- NEW entry: no motion-control studio existed in studioKnowledgeBase.json. Tab id motion-control with label Motion Control (components/StandaloneShell.js:107, 937 persistentStudio(motion-control)).
- Modes Motion Transfer / Objects Swap and their descriptions (MotionControlStudio.jsx:607, 1124-1143; en modes).
- Required inputs: reference video and at least one character image; error texts (MotionControlStudio.jsx:877-885; en errors).
- Limits: video 100 MB (:806), image 20 MB (:840), images per model maxImages (30 for 2.5 models, 9 for 2.0), min duration 4, max 30/15 (models.js:31746-31830).
- Defaults: model seedance-2.5-motion-control (:610), aspect 16:9 (:619), duration 5 (:620), audio off (:623), seed -1 (:624), quality high (:621), high bitrate off (:622).
- Duration popover: slider min 4, presets 5/10/15/20/30 filtered by model max (:1285-1313). Model switch resets duration/aspect if unsupported (:627-634).
- Advanced popover: High Bitrate when supportsBitrate, Quality High/Basic only for seedance-2-motion-control, Seed number box (:1360-1419).
- Library popover (Videos/Images/Results tabs, Use as Video, Add as Image, Delete from Library, Enlarge preview) and the shared Saved button (:379-524, 1485-1497).
- Result card actions: Download, publish button, Use as Video, Delete with confirm; history in local storage (:956-1083).
- The studio prefixes a built-in instruction to the optional prompt depending on mode (muapi.js:330-358).
- _Not confirmable in code (left out or stated generally):_
  - Credit/cost per generation: no cost hint in the studio code.
  - Differences between Seedance 2.5 Intl and Seedance 2.5 Spicy models beyond their model descriptions: not stated in guide, which defers to the description shown in the menu.
  - History has no maximum count in code (saveHistory does not slice); guide does not state a limit.
  - The advanced popover header is built from several strings and is not quoted; the button has only a sliders icon with no text label.
  - Exact label of the Aspect ratio value adaptive for 2.5 models: shown as a raw value in the menu; not described in steps.

### Motion Control (`motion-control`)
- NEW entry: no motion-control studio existed in studioKnowledgeBase.json. Tab id motion-control with label Motion Control (components/StandaloneShell.js:107, 937 persistentStudio(motion-control)).
- Modes Motion Transfer / Objects Swap and their descriptions (MotionControlStudio.jsx:607, 1124-1143; en modes).
- Required inputs: reference video and at least one character image; error texts (MotionControlStudio.jsx:877-885; en errors).
- Limits: video 100 MB (:806), image 20 MB (:840), images per model maxImages (30 for 2.5 models, 9 for 2.0), min duration 4, max 30/15 (models.js:31746-31830).
- Defaults: model seedance-2.5-motion-control (:610), aspect 16:9 (:619), duration 5 (:620), audio off (:623), seed -1 (:624), quality high (:621), high bitrate off (:622).
- Duration popover: slider min 4, presets 5/10/15/20/30 filtered by model max (:1285-1313). Model switch resets duration/aspect if unsupported (:627-634).
- Advanced popover: High Bitrate when supportsBitrate, Quality High/Basic only for seedance-2-motion-control, Seed number box (:1360-1419).
- Library popover (Videos/Images/Results tabs, Use as Video, Add as Image, Delete from Library, Enlarge preview) and the shared Saved button (:379-524, 1485-1497).
- Result card actions: Download, publish button, Use as Video, Delete with confirm; history in local storage (:956-1083).
- The studio prefixes a built-in instruction to the optional prompt depending on mode (muapi.js:330-358).
- _Not confirmable in code (left out or stated generally):_
  - Credit/cost per generation: no cost hint in the studio code.
  - Differences between Seedance 2.5 Intl and Seedance 2.5 Spicy models beyond their model descriptions: not stated in guide, which defers to the description shown in the menu.
  - History has no maximum count in code (saveHistory does not slice); guide does not state a limit.
  - The advanced popover header is built from several strings and is not quoted; the button has only a sliders icon with no text label.
  - Exact label of the Aspect ratio value adaptive for 2.5 models: shown as a raw value in the menu; not described in steps.

### motion-director.changes (`motion-director.changes`)
- Approve button confirmed as 'Approve & build film' with 'Revise' (FilmDirectorChat.tsx PlanCard approveLabel/rejectLabel).
- Rewrote the flow from 'Generate then review' to the real chat flow: Generate -> Ink Press offer (Use Ink Press / Let the director pick shots / Choose shot cards… / Work it out together) -> storyboard card -> Approve & build film -> FINAL FILM card (FilmDirectorChat.tsx, useFilmDirector.ts send()/chooseTemplate()).
- Added chat-driven decisions: guided stages brief -> direction -> mapping with buttons 'Looks right — next', 'Use A/B/C', 'Use my recommendation', 'Looks right — write the storyboard', 'You decide'; decisions are posted into the chat (useFilmDirector.ts lines ~281-288, coCreate.ts messages).
- Added the product check before the storyboard (coCreate.ts briefMessage 'Product check'; startCoCreate runs capture then the brief) and the two-phase capture: quick capture first (directorClient.ts comment, ~2 min, max 270 s wait), pages the storyboard needs captured at build (filmPipeline.ts:371-375).
- Added the seven-step progress strip Product/Capture/Storyboard/Animate/Beat sync/Frame QA/Deliver (filmSteps.ts) and ■ Stop (FilmDirectorChat.tsx).
- Added 'Continue editing' tile; it also appears for a project recovered from the old Motion Studio because the entry also reads the 'motion-studio:entry-seen-v1' flag and legacy storage keys (MotionStudioEntry.tsx hasSeenEntry/hasCurrentProject; store.ts LEGACY_STORAGE_KEY).
- Added leave confirmations: 'An MP4 is still rendering. Leaving cancels it. Leave anyway?' (i18n.ts export.leaveConfirm via confirmLeaveWhileRendering in MotionStudioEntry.tsx/App.tsx), window.confirm in FilmResultCard, beforeunload guard during render (webRenderer.ts guardTabWhileRendering) and during uploads (mediaUpload.ts holdTabWhileUploading).
- Corrected 'length and aspect ratio then Generate': there is no length control; length is read from the message, default 20 s (MotionStudioEntry.tsx DEFAULT_DURATION_SEC; filmChat.ts parseFilmRequest); plan limits 5-90 s, 2-14 scenes (directorPlan.ts PLAN_LIMITS); max 12 picked shots (MAX_PICKED_SHOTS = maxScenes - 2).
- Corrected library size: removed the '150-shot ShotCraft library' claim; the Templates footer shows its own live count (MOTION_TEMPLATES.length), not hard-coded.
- Documented MP4 options on the film card: Render MP4, Fast draft · WxH, Render without music, Download MP4, Design spec, Open in Motion Workbench (FilmDirectorChat.tsx FilmResultCard) and the Workbench Export video row (ExportButton.tsx).
- Documented Brand Kit pill, attach button, Templates picker (categories + search), Recent Projects (MotionStudioEntry.tsx).
- Director requires the user's OpenAI key (app/api/motion-studio/director/route.ts:251); previous 'quick project fallback' wording removed (Ink Press fallback is stated per useFilmDirector.ts:354).
- Post to social after export (ExportButton.tsx postToSocial) opens the Publish to social window (see social-publishing guide).
- _Not confirmable in code (left out or stated generally):_
  - Contents of the Workbench Library, Inspector and Timeline panels beyond tab names (not read in detail); described only generally.
  - Exact upgrade prompt text shown by the plan check when Generate is clicked without a plan (SmartVideoAccessProvider not read).
  - Whether the quick-capture time limit shown to users is always 2 minutes (code comment says about 2 minutes, with a 4.5 minute wait cap and a message 'it took longer than 2½ minutes').
  - Exact number of shot cards in Templates (shown live in the picker footer).
  - Maximum size and count of attached media files (no limit found in the entry code).
  - How the Edit agent interprets commands in the Workbench.

### Motion Director (`motion-director`)
- Approve button confirmed as 'Approve & build film' with 'Revise' (FilmDirectorChat.tsx PlanCard approveLabel/rejectLabel).
- Rewrote the flow from 'Generate then review' to the real chat flow: Generate -> Ink Press offer (Use Ink Press / Let the director pick shots / Choose shot cards… / Work it out together) -> storyboard card -> Approve & build film -> FINAL FILM card (FilmDirectorChat.tsx, useFilmDirector.ts send()/chooseTemplate()).
- Added chat-driven decisions: guided stages brief -> direction -> mapping with buttons 'Looks right — next', 'Use A/B/C', 'Use my recommendation', 'Looks right — write the storyboard', 'You decide'; decisions are posted into the chat (useFilmDirector.ts lines ~281-288, coCreate.ts messages).
- Added the product check before the storyboard (coCreate.ts briefMessage 'Product check'; startCoCreate runs capture then the brief) and the two-phase capture: quick capture first (directorClient.ts comment, ~2 min, max 270 s wait), pages the storyboard needs captured at build (filmPipeline.ts:371-375).
- Added the seven-step progress strip Product/Capture/Storyboard/Animate/Beat sync/Frame QA/Deliver (filmSteps.ts) and ■ Stop (FilmDirectorChat.tsx).
- Added 'Continue editing' tile; it also appears for a project recovered from the old Motion Studio because the entry also reads the 'motion-studio:entry-seen-v1' flag and legacy storage keys (MotionStudioEntry.tsx hasSeenEntry/hasCurrentProject; store.ts LEGACY_STORAGE_KEY).
- Added leave confirmations: 'An MP4 is still rendering. Leaving cancels it. Leave anyway?' (i18n.ts export.leaveConfirm via confirmLeaveWhileRendering in MotionStudioEntry.tsx/App.tsx), window.confirm in FilmResultCard, beforeunload guard during render (webRenderer.ts guardTabWhileRendering) and during uploads (mediaUpload.ts holdTabWhileUploading).
- Corrected 'length and aspect ratio then Generate': there is no length control; length is read from the message, default 20 s (MotionStudioEntry.tsx DEFAULT_DURATION_SEC; filmChat.ts parseFilmRequest); plan limits 5-90 s, 2-14 scenes (directorPlan.ts PLAN_LIMITS); max 12 picked shots (MAX_PICKED_SHOTS = maxScenes - 2).
- Corrected library size: removed the '150-shot ShotCraft library' claim; the Templates footer shows its own live count (MOTION_TEMPLATES.length), not hard-coded.
- Documented MP4 options on the film card: Render MP4, Fast draft · WxH, Render without music, Download MP4, Design spec, Open in Motion Workbench (FilmDirectorChat.tsx FilmResultCard) and the Workbench Export video row (ExportButton.tsx).
- Documented Brand Kit pill, attach button, Templates picker (categories + search), Recent Projects (MotionStudioEntry.tsx).
- Director requires the user's OpenAI key (app/api/motion-studio/director/route.ts:251); previous 'quick project fallback' wording removed (Ink Press fallback is stated per useFilmDirector.ts:354).
- Post to social after export (ExportButton.tsx postToSocial) opens the Publish to social window (see social-publishing guide).
- Reviewer fix: removed 'plan' wording (base access is included for signed-in accounts).
- _Not confirmable in code (left out or stated generally):_
  - Contents of the Workbench Library, Inspector and Timeline panels beyond tab names (not read in detail); described only generally.
  - Exact upgrade prompt text shown by the plan check when Generate is clicked without a plan (SmartVideoAccessProvider not read).
  - Whether the quick-capture time limit shown to users is always 2 minutes (code comment says about 2 minutes, with a 4.5 minute wait cap and a message 'it took longer than 2½ minutes').
  - Exact number of shot cards in Templates (shown live in the picker footer).
  - Maximum size and count of attached media files (no limit found in the entry code).
  - How the Edit agent interprets commands in the Workbench.

### photo-studio.changes (`photo-studio.changes`)
- Corrected 'Optionally select a brand for context': the brand is stored with the record and filters History; the prompt is built only from category and style (app/api/photo-studio/route.ts:167-176).
- Corrected 'Click Generate' details: Generate is disabled until a style is picked (photo-studio/page.tsx:177 disabled={loading || !style}); category change clears style (:158).
- Added exact category names and all 30 style names with the category mapping (page.tsx:12-14, :76-91; counted: 6 categories x 5 styles).
- Added polling behaviour: 90 checks x 2s, 'Generation timed out' (page.tsx:34-43).
- Added output facts: 1:1 aspect ratio, n=1, gpt-image-2 (route.ts:21,172).
- Added 'History' is loaded only when a brand is selected (page.tsx:34-40) and 'Result' / 'Download' behaviour (opens image in new tab :186).
- Added the 'Personalize' button shown next to the brand drop-down when a photo exists (page.tsx:93-112, :133-137).
- Added entry points: left menu 'Tools' > 'Photo Studio' and per-brand 'Photo Studio' link (layout.tsx:96-155,:189-198).
- Removed 'Generation limited by backend processing time' vague limitation in favour of the concrete 3-minute timeout.
- _Not confirmable in code (left out or stated generally):_
  - How MuAPI key is supplied to the page's fetch calls: the server route requires header x-api-key (route.ts:16-19, 'MuAPI key required'); the shell adds it to requests via interceptors for axios (StandaloneShell.js:695-698); I did not confirm the fetch() calls used by this page carry it, so the guide only gives the generic API-keys line.
  - How 'Generation failed' errors are worded to the user beyond alert(err.message).
  - What the product image URL does to the result: it is sent as image_url to the image endpoint (route.ts:175); visual effect not verified.
  - 'Personalize' window behaviour (shared personalization modal).

### Photo Studio (`photo-studio`)
- Corrected 'Optionally select a brand for context': the brand is stored with the record and filters History; the prompt is built only from category and style (app/api/photo-studio/route.ts:167-176).
- Corrected 'Click Generate' details: Generate is disabled until a style is picked (photo-studio/page.tsx:169 disabled={loading || !style}); category change clears style (:146).
- Added exact category names and all 30 style names with the category mapping (page.tsx:12-14, :81-98; counted: 6 categories x 5 styles).
- Added polling behaviour: 90 checks x 2s, 'Generation timed out' (page.tsx:44-52).
- Added output facts: 1:1 aspect ratio, n=1, gpt-image-2 (route.ts:21,176).
- Added 'History' is loaded only when a brand is selected (page.tsx:34-40) and 'Result' / 'Download' behaviour (opens image in new tab, :181).
- Added the 'Personalize' button shown next to the brand drop-down when a photo exists (page.tsx:100-137).
- Added entry points: left menu 'Tools' > 'Photo Studio' and per-brand 'Photo Studio' link (layout.tsx:185-197).
- Removed 'Generation limited by backend processing time' vague limitation in favour of the concrete 3-minute timeout.
- _Not confirmable in code (left out or stated generally):_
  - How MuAPI key is supplied to the page's fetch calls: the server route requires header x-api-key (route.ts:16-19, 'MuAPI key required'); the shell adds it to requests via interceptors for axios (StandaloneShell.js:695-698); I did not confirm the fetch() calls used by this page carry it, so the guide only gives the generic API-keys line.
  - How 'Generation failed' errors are worded to the user beyond alert(err.message).
  - What the product image URL does to the result: it is sent as image_url to the image endpoint (route.ts:175); visual effect not verified.
  - 'Personalize' window behaviour (shared personalization modal).

### recast.changes (`recast.changes`)
- Generate button is 'Swap Body' / 'Swapping...' (messages/en/recastStudio.json buttons).
- Models read now from models.js recastModels (~31694-31736): Kling 3.0 Pro Motion Control (first/default), Runway Act Two, Wan2.2 Animate. Count of 3 computed from the array.
- ADDED: Aspect Ratio list only for models with inputs.aspect_ratio (Runway Act Two; RecastStudio.jsx:696,1177); Orientation list only for kling-v3.0-pro-recast (:1209, :861-863), options Image/Video with 'Max 10s'/'Max 30s' descriptions, default 'image' (:543).
- ADDED: text note placeholder 'Optional — describe the motion or scene...'; prompt only sent when model hasPrompt (:860; Runway Act Two hasPrompt false).
- ADDED: limits video 50MB, image 10MB (:734,:768), upload allowlist (uploadContract.js), popups 'Please upload a source video first.' / 'Please upload a character image first.' (:840-847, alert).
- ADDED: two library buttons: 'Library' (local per-browser Asset Library with Videos/Images/Results tabs, 'Use', delete, 30 per tab: :238-390, :1247-1306) and 'Saved' (AssetLibraryButton, :1309).
- ADDED: clicking an upload button clears it (:65-72); drag-drop on buttons and shell (:125-135, :797-805); gallery actions copy prompt, Download (bodyswap-<id>.mp4), Post to social, AI assist, Delete; gallery keeps 30 (:818).
- REMOVED unverifiable old claims: face swap, batch processing for 1,000 variants, blending modes, 'Send to' actions, invented businessImpact numbers.
- Shell tab label is 'Body Swap' (StandaloneShell.js:114); route /studio/recast.
- _Not confirmable in code (left out or stated generally):_
  - How long a video each model accepts beyond the Kling orientation notes (10s / 30s shown in the UI): not otherwise in code.
  - Quality differences between the three models: not in code; omitted.
  - Credit cost: no cost hint in this studio; omitted.
  - The tooltip text for upload buttons is composed at runtime from templates; quoted from messages with {label} placeholder.

### Body Swap (`recast`)
- Generate button is 'Swap Body' / 'Swapping...' (messages/en/recastStudio.json buttons).
- Models read now from models.js recastModels (~31694-31736): Kling 3.0 Pro Motion Control (first/default), Runway Act Two, Wan2.2 Animate. Count of 3 computed from the array.
- ADDED: Aspect Ratio list only for models with inputs.aspect_ratio (Runway Act Two; RecastStudio.jsx:696,1177); Orientation list only for kling-v3.0-pro-recast (:1209, :861-863), options Image/Video with 'Max 10s'/'Max 30s' descriptions, default 'image' (:543).
- ADDED: text note placeholder 'Optional — describe the motion or scene...'; prompt only sent when model hasPrompt (:860; Runway Act Two hasPrompt false).
- ADDED: limits video 50MB, image 10MB (:734,:768), upload allowlist (uploadContract.js), popups 'Please upload a source video first.' / 'Please upload a character image first.' (:840-847, alert).
- ADDED: two library buttons: 'Library' (local per-browser Asset Library with Videos/Images/Results tabs, 'Use', delete, 30 per tab: :238-390, :1247-1306) and 'Saved' (AssetLibraryButton, :1309).
- ADDED: clicking an upload button clears it (:65-72); drag-drop on buttons and shell (:125-135, :797-805); gallery actions copy prompt, Download (bodyswap-<id>.mp4), Post to social, AI assist, Delete; gallery keeps 30 (:818).
- REMOVED unverifiable old claims: face swap, batch processing for 1,000 variants, blending modes, 'Send to' actions, invented businessImpact numbers.
- Shell tab label is 'Body Swap' (StandaloneShell.js:114); route /studio/recast.
- _Not confirmable in code (left out or stated generally):_
  - How long a video each model accepts beyond the Kling orientation notes (10s / 30s shown in the UI): not otherwise in code.
  - Quality differences between the three models: not in code; omitted.
  - Credit cost: no cost hint in this studio; omitted.
  - The tooltip text for upload buttons is composed at runtime from templates; quoted from messages with {label} placeholder.

### social-publishing.changes (`social-publishing.changes`)
- BIG CHANGE: Social Publishing is no longer a standalone studio. StandaloneShell.js:152 maps slug 'social-publishing' to the 'image' tab with the comment 'Publishing is a modal opened from each image/video studio now'; SocialPublishProvider wraps all studios (StandaloneShell.js:930). Route set to /studio/image.
- The old SocialPublishing.tsx page (single form with media URL, YouTube/Instagram/TikTok fields, history in localStorage) is not mounted anywhere; removed 'Publish history (last 12)' and the manual 'media URL' input from the guide.
- Documented how users open it: PublishStep ('Post to social' button) in Image, Video, VFX, Storyboard, Thumbnail, Design Agent, Zack D, Marketing, AI Influencer, Cinema, Lip Sync, Vibe Motion, Clipping, Recast, Motion Control studios, plus openPublish in Motion Director/Motion Studio ExportButton, Layers Studio, Zack D and Personalization (grep of PublishStep/openPublish).
- Documented the four steps from types.ts STEPS: Write, Thumbnail, Destinations, Review & Publish, with footer Cancel/Back/Continue (SocialPublishModal.tsx).
- Platforms now eight (YouTube, Instagram, TikTok, Facebook, LinkedIn, Pinterest, Threads, X) with video/image support from ALL_PLATFORMS in DestinationsStep.tsx (YouTube, TikTok video only).
- Account flow: Connect button opens the authorisation page in a new tab, Refresh, manual account ID, Disconnect, per-account settings (DestinationsStep.tsx, AccountCard.tsx, ConnectAccountButton.tsx).
- Publish is sent by 'Publish Now (n)' in DestinationsStep.tsx handlePublish; the Review & Publish button and footer Publish button do not send (SocialPublishModal.tsx handlePublish only waits 500 ms and calls updateDestinations; isLastStep handleContinue is a no-op). Guide tells users to use Publish Now.
- Limitation found in code: Write step updates writeCopy, but DestinationsStep.publishOne reads socialCopy (set only from openPublish title/caption); thumbnails are not in the payload either. Stated as a limitation rather than promising the Write text is posted.
- Removed old inputs that no longer exist: made for kids, category ID, share to feed, disable duet/stitch, placement; the payload sets fixed defaults (DestinationsStep.tsx publishOne).
- Write step details from WriteStep.tsx/AiWritingToolbar.tsx (limits 5000/2200/2200/63206 chars, >30 hashtags warning); Thumbnail step from ThumbnailStep.tsx (models GPT Image 2/GPT Image 1/DALL·E 3, 1-4 variations, Aspect Ratio).
- Write and Thumbnail helpers use the user's own OpenAI key (app/api/proxy/openai-enhance and thumbnail-generate call getOpenAiKeyForUser).
- _Not confirmable in code (left out or stated generally):_
  - Whether each platform honours Schedule, Tags, Location and Alt text (values are passed in the request; platform behaviour not visible in code).
  - Exact look of the Post to social button in every studio (some are icon-only round buttons whose text is inside the shared PublishStep component).
  - Whether the platform authorisation tab returns the account automatically; the code refreshes the list 2.5 s after opening it and offers Refresh.
  - Contents of the thumbnail template lists (Recommended / Explore Ideas) beyond their tab names.
  - Behaviour of the Improve/Tone drop-down: the two share one open/closed state in AiWritingToolbar.tsx, so opening one may open both; steps do not depend on it.

### Social Publishing (`social-publishing`)
- BIG CHANGE: Social Publishing is no longer a standalone studio. StandaloneShell.js:152 maps slug 'social-publishing' to the 'image' tab with the comment 'Publishing is a modal opened from each image/video studio now'; SocialPublishProvider wraps all studios (StandaloneShell.js:930). Route set to /studio/image.
- The old SocialPublishing.tsx page (single form with media URL, YouTube/Instagram/TikTok fields, history in localStorage) is not mounted anywhere; removed 'Publish history (last 12)' and the manual 'media URL' input from the guide.
- Documented how users open it: PublishStep ('Post to social' button) in Image, Video, VFX, Storyboard, Thumbnail, Design Agent, Zack D, Marketing, AI Influencer, Cinema, Lip Sync, Vibe Motion, Clipping, Recast, Motion Control studios, plus openPublish in Motion Director/Motion Studio ExportButton, Layers Studio, Zack D and Personalization (grep of PublishStep/openPublish).
- Documented the four steps from types.ts STEPS: Write, Thumbnail, Destinations, Review & Publish, with footer Cancel/Back/Continue (SocialPublishModal.tsx).
- Platforms now eight (YouTube, Instagram, TikTok, Facebook, LinkedIn, Pinterest, Threads, X) with video/image support from ALL_PLATFORMS in DestinationsStep.tsx (YouTube, TikTok video only).
- Account flow: Connect button opens the authorisation page in a new tab, Refresh, manual account ID, Disconnect, per-account settings (DestinationsStep.tsx, AccountCard.tsx, ConnectAccountButton.tsx).
- Publish is sent by 'Publish Now (n)' in DestinationsStep.tsx handlePublish; the Review & Publish button and footer Publish button do not send (SocialPublishModal.tsx handlePublish only waits 500 ms and calls updateDestinations; isLastStep handleContinue is a no-op). Guide tells users to use Publish Now.
- Limitation found in code: Write step updates writeCopy, but DestinationsStep.publishOne reads socialCopy (set only from openPublish title/caption); thumbnails are not in the payload either. Stated as a limitation rather than promising the Write text is posted.
- Removed old inputs that no longer exist: made for kids, category ID, share to feed, disable duet/stitch, placement; the payload sets fixed defaults (DestinationsStep.tsx publishOne).
- Write step details from WriteStep.tsx/AiWritingToolbar.tsx (limits 5000/2200/2200/63206 chars, >30 hashtags warning); Thumbnail step from ThumbnailStep.tsx (models GPT Image 2/GPT Image 1/DALL·E 3, 1-4 variations, Aspect Ratio).
- Write and Thumbnail helpers use the user's own OpenAI key (app/api/proxy/openai-enhance and thumbnail-generate call getOpenAiKeyForUser).
- _Not confirmable in code (left out or stated generally):_
  - Whether each platform honours Schedule, Tags, Location and Alt text (values are passed in the request; platform behaviour not visible in code).
  - Exact look of the Post to social button in every studio (some are icon-only round buttons whose text is inside the shared PublishStep component).
  - Whether the platform authorisation tab returns the account automatically; the code refreshes the list 2.5 s after opening it and offers Refresh.
  - Contents of the thumbnail template lists (Recommended / Explore Ideas) beyond their tab names.
  - Behaviour of the Improve/Tone drop-down: the two share one open/closed state in AiWritingToolbar.tsx, so opening one may open both; steps do not depend on it.

### storyboard.changes (`storyboard.changes`)
- Removed 'episodes' (episode title/summary): StoryboardPlanner.tsx has no episode UI; sections are '1. Project & Creative Brief', Characters, '2. Scenes', '3. Generate Storyboard Video'.
- Characters now only have Name, Traits and a reference image (upload or URL); old 'outfit' field is gone (CharacterLibrary.tsx:78-130).
- Added PROJECT switcher with New/Delete (ProjectBar.tsx:6-55).
- Added OpenAI image panels: FRAME ENGINE MuAPI | OpenAI Images, model and Panel detail selects (ShotEditor.tsx FRAME ENGINE block).
- Added frame Edit (placeholder 'Change this frame: make it night, add a lighthouse...') and Sketch (2.5 MB, image only, ShotEditor.tsx MAX_SKETCH_BYTES, handleSketch); both OpenAI-only; up to 4 references (MAX_REFERENCE_IMAGES).
- Added Export GIF with 'seconds per frame' (ShotEditor.tsx handleExportGif; exportUtils.ts exportGif, maxWidth 640, delay clamp).
- Documented the per-scene Frame/Regenerate button (title 'Generate a still frame for this shot').
- Clip length is 5s/10s only and aspect ratio 16:9/9:16 only (StoryboardPlanner.tsx CLIP_LENGTHS, aspect buttons); added duration-mismatch warning with 'Fit to' button.
- Added JSON and PDF exports (PDF opens print dialog, HTML download if pop-up blocked: exportUtils.ts exportPdf) and Send to menu limited to Video Studio, Cinema Studio, VFX Studio (SendToMenu.tsx targets).
- Navigation (project bar, Shot Editor, Analysis) is locked while generating (StoryboardPlanner.tsx fieldset disabled/isGenerating).
- Scene Analysis page described from SceneAnalysis.tsx (stats and breakdown, read-only).
- Removed drag 'Apply camera controls: lens, focal length' step wording; camera controls are inside a per-scene 'Camera' toggle (ShotEditor.tsx).
- Removed stale claim 'Requires SmartVideo GO entitlement' as a vague limit: now stated precisely (message 'An active plan is required to generate storyboards.'; server routes check entitlement).
- Aspect ratio/model counts removed; default MuAPI frame model is flux-2-dev (models.ts DEFAULT_STORYBOARD_MODEL_ID), not hard-coded in steps.
- _Not confirmable in code (left out or stated generally):_
  - Whether the storyboard video can be downloaded from the player (the planner shows only a video element with controls; no download button in code).
  - Exact list of MuAPI and OpenAI model names (OpenAI list comes from the server route and can be extended by configuration; built-in labels Flare (fast), Sunburst (detailed), GPT Image 2 are in src/lib/storyboardOpenAiModels.ts but not quoted).
  - How long frame or video generation takes (polling limits exist: frames up to 90 attempts at 2s, video up to 150 at 3s, but real timing is service-dependent).
  - The Post to social hover button on scene frames: present in ShotEditor.tsx via PublishStep but its on-screen label inside the small round button was not checked.

### Storyboard (`storyboard`)
- Removed 'episodes' (episode title/summary): StoryboardPlanner.tsx has no episode UI; sections are '1. Project & Creative Brief', Characters, '2. Scenes', '3. Generate Storyboard Video'.
- Characters now only have Name, Traits and a reference image (upload or URL); old 'outfit' field is gone (CharacterLibrary.tsx:78-130).
- Added PROJECT switcher with New/Delete (ProjectBar.tsx:6-55).
- Added OpenAI image panels: FRAME ENGINE MuAPI | OpenAI Images, model and Panel detail selects (ShotEditor.tsx FRAME ENGINE block).
- Added frame Edit (placeholder 'Change this frame: make it night, add a lighthouse...') and Sketch (2.5 MB, image only, ShotEditor.tsx MAX_SKETCH_BYTES, handleSketch); both OpenAI-only; up to 4 references (MAX_REFERENCE_IMAGES).
- Added Export GIF with 'seconds per frame' (ShotEditor.tsx handleExportGif; exportUtils.ts exportGif, maxWidth 640, delay clamp).
- Documented the per-scene Frame/Regenerate button (title 'Generate a still frame for this shot').
- Clip length is 5s/10s only and aspect ratio 16:9/9:16 only (StoryboardPlanner.tsx CLIP_LENGTHS, aspect buttons); added duration-mismatch warning with 'Fit to' button.
- Added JSON and PDF exports (PDF opens print dialog, HTML download if pop-up blocked: exportUtils.ts exportPdf) and Send to menu limited to Video Studio, Cinema Studio, VFX Studio (SendToMenu.tsx targets).
- Navigation (project bar, Shot Editor, Analysis) is locked while generating (StoryboardPlanner.tsx fieldset disabled/isGenerating).
- Scene Analysis page described from SceneAnalysis.tsx (stats and breakdown, read-only).
- Removed drag 'Apply camera controls: lens, focal length' step wording; camera controls are inside a per-scene 'Camera' toggle (ShotEditor.tsx).
- Removed stale claim 'Requires SmartVideo GO entitlement' as a vague limit: now stated precisely (message 'An active plan is required to generate storyboards.'; server routes check entitlement).
- Aspect ratio/model counts removed; default MuAPI frame model is flux-2-dev (models.ts DEFAULT_STORYBOARD_MODEL_ID), not hard-coded in steps.
- _Not confirmable in code (left out or stated generally):_
  - Whether the storyboard video can be downloaded from the player (the planner shows only a video element with controls; no download button in code).
  - Exact list of MuAPI and OpenAI model names (OpenAI list comes from the server route and can be extended by configuration; built-in labels Flare (fast), Sunburst (detailed), GPT Image 2 are in src/lib/storyboardOpenAiModels.ts but not quoted).
  - How long frame or video generation takes (polling limits exist: frames up to 90 attempts at 2s, video up to 150 at 3s, but real timing is service-dependent).
  - The Post to social hover button on scene frames: present in ShotEditor.tsx via PublishStep but its on-screen label inside the small round button was not checked.

### thumbnail-studio.changes (`thumbnail-studio.changes`)
- Rewrote steps from the real UI: three tabs generate/mine/community (ThumbnailStudio.tsx:582-593), mode toggle '✦ Generate' / '✎ Edit image' (:606-613), description box and template chips (:633-669), 8 STYLE buttons (:124-133,:672-684).
- Removed 'flux-dev' as the selectable model: the MODEL / API list contains GPT Image 2 (default), GPT Image 1, DALL·E 3, DALL·E 2 (ThumbnailStudio.tsx:117-122, :297).
- Removed claims about 'category templates' as a separate selector and 'size/quality/aspect ratio' as separate inputs: templates are 10 chips (:135-146); aspect ratio is part of the CANVAS SIZE cards (types.ts:22-29); QUALITY cards Draft/Standard/Best (types.ts:39-43).
- Added Advanced options: OUTPUT FORMAT (default JPEG), COMPRESSION 10-100 default 85 hidden for PNG, VARIATIONS 1-4, 'Share to community' default on (:809-883, :301-304).
- Added Edit image mode with REFERENCE IMAGE, mask tools (ImageEditor.tsx:122-200) and Refine last result / Apply refinement (:916-943); noted refine uses DEFAULT_IMAGE_MODEL 'flux-dev' regardless of selection (:466-469, muapiImage.ts:35).
- Added gallery behaviour: mine tab capped at 100 local images (:254), hover icon buttons Download/Reuse settings/Make private|public/Delete (ImageGallery.tsx:103-129), community tab loads latest 50 public rows or built-in seed thumbnails (:187-248).
- Corrected the CTR engine description: it is automatic, not a button; it appends generic CTR cues (ctrEngine.ts:46-58, UNIVERSAL_TAIL).
- Added access note: Generate calls requireEntitlement(SMARTVIDEO_GO), opening the upgrade modal when not allowed (ThumbnailStudio.tsx:399-403, SmartVideoAccessProvider.tsx:108-124).
- Added hand-off: description pre-filled from GO-Viral/Storyboard (ThumbnailStudio.tsx:285-295; crossStudio.ts:186-189 lists thumbnail-studio as an image target).
- Removed 'Gallery requires session ID' troubleshooting and 'provider logo map' feature (cosmetic only).
- Added Post to social / Enhance / Personalize buttons in the refine panel (:944-959; SocialPublishProvider.tsx:234; StandaloneShell.js:82-86).
- _Not confirmable in code (left out or stated generally):_
  - Whether each of the 8 STYLE buttons visibly changes the result: generateCTRPrompt only has presets for gaming/business/finance/tutorial/reaction/ai/marketing/agency/news/crypto, so the 8 style ids fall back to the same generic CTR phrase; the guide only says the style is sent and saved with the image.
  - The exact behaviour of the paid-access check for individual accounts (resolved server-side); the guide only says an upgrade window opens when access is missing.
  - How the 'AI enhance prompt' wand is billed or which key it uses (server proxy /api/proxy/openai-enhance); left out.
  - Mask effect on output quality: mask is passed to the image client but its handling for the four listed models was not verified; the guide only describes the UI.

### Thumbnail Studio (`thumbnail-studio`)
- Rewrote steps from the real UI: three tabs generate/mine/community (ThumbnailStudio.tsx:582-593), mode toggle '✦ Generate' / '✎ Edit image' (:606-613), description box and template chips (:633-669), 8 STYLE buttons (:124-133,:672-684).
- Removed 'flux-dev' as the selectable model: the MODEL / API list contains GPT Image 2 (default), GPT Image 1, DALL·E 3, DALL·E 2 (ThumbnailStudio.tsx:117-122, :297).
- Removed claims about 'category templates' as a separate selector and 'size/quality/aspect ratio' as separate inputs: templates are 10 chips (:135-146); aspect ratio is part of the CANVAS SIZE cards (types.ts:22-29); QUALITY cards Draft/Standard/Best (types.ts:39-43).
- Added Advanced options: OUTPUT FORMAT (default JPEG), COMPRESSION 10-100 default 85 hidden for PNG, VARIATIONS 1-4, 'Share to community' default on (:809-883, :301-304).
- Added Edit image mode with REFERENCE IMAGE, mask tools (ImageEditor.tsx:122-200) and Refine last result / Apply refinement (:916-943); noted refine uses DEFAULT_IMAGE_MODEL 'flux-dev' regardless of selection (:466-469, muapiImage.ts:35).
- Added gallery behaviour: mine tab capped at 100 local images (:254), hover icon buttons Download/Reuse settings/Make private|public/Delete (ImageGallery.tsx:103-129), community tab loads latest 50 public rows or built-in seed thumbnails (:187-248).
- Corrected the CTR engine description: it is automatic, not a button; it appends generic CTR cues (ctrEngine.ts:46-58, UNIVERSAL_TAIL).
- Added access note: Generate calls requireEntitlement(SMARTVIDEO_GO), opening the upgrade modal when not allowed (ThumbnailStudio.tsx:399-403, SmartVideoAccessProvider.tsx:108-124).
- Added hand-off: description pre-filled from GO-Viral/Storyboard (ThumbnailStudio.tsx:285-295; crossStudio.ts:186-189 lists thumbnail-studio as an image target).
- Removed 'Gallery requires session ID' troubleshooting and 'provider logo map' feature (cosmetic only).
- Added Post to social / Enhance / Personalize buttons in the refine panel (:944-959; SocialPublishProvider.tsx:234; StandaloneShell.js:82-86).
- Reviewer fix: removed 'paid plan' wording (base access is included for signed-in accounts).
- _Not confirmable in code (left out or stated generally):_
  - Whether each of the 8 STYLE buttons visibly changes the result: generateCTRPrompt only has presets for gaming/business/finance/tutorial/reaction/ai/marketing/agency/news/crypto, so the 8 style ids fall back to the same generic CTR phrase; the guide only says the style is sent and saved with the image.
  - The exact behaviour of the paid-access check for individual accounts (resolved server-side); the guide only says an upgrade window opens when access is missing.
  - How the 'AI enhance prompt' wand is billed or which key it uses (server proxy /api/proxy/openai-enhance); left out.
  - Mask effect on output quality: mask is passed to the image client but its handling for the four listed models was not verified; the guide only describes the UI.

### vfx-studio.changes (`vfx-studio.changes`)
- Rewrote around the 2026-11-07 redesign: banner 'AI VFX Studio', sticky input panel (VfxInputBar.tsx) and card grid (VFXGenerate.tsx); category tabs 'AI Effects', 'Motion Controls', 'VFX' with counts (effectCatalog.ts VFX_CATEGORIES).
- Counts computed from effectCatalog.ts: AI_EFFECTS 64, MOTION_CONTROLS 47, VFX_EFFECTS 9 (python regex count of '{ id:' entries). The old FAQ said Motion Controls 64 and total 120, which was wrong (total is 120 = 64+47+9, motion is 47).
- Removed claim that VFX Studio accepts videos or 'effect parameters' (old useCases): input is one image only (VfxInputBar.tsx upload square accepts image/jpeg,png,webp; VFXGenerate.tsx:accept).
- Source image is required, effect required: error strings 'Select an effect first' and 'Upload an image or paste an image URL first' (VFXGenerate.tsx handleGenerate).
- Added paste-URL box, drag-and-drop, Remove image (VfxInputBar.tsx); URL must end in .jpg/.jpeg/.png/.webp (useVideoGeneration.ts isValidImageUrl).
- Settings are Aspect (9:16 Portrait/16:9 Landscape/1:1 Square), Duration (5s/10s), Size (480p/720p), Quality (Medium/High) with defaults 16:9, 5s, 480p, Medium (VfxInputBar.tsx options; VFXGenerate.tsx useState defaults).
- Upload limit 10 MB image from packages/studio/src/uploadContract.js UPLOAD_LIMITS.image via useVideoGeneration.ts validateFile.
- Result UI documented: progress window 'Generating your video...', 'Your video is ready!', result panel buttons Download, Copy URL, Post to social, Enhance, Regenerate, New Video (VFXGenerate.tsx).
- Handoff narrowed to what the code does: Storyboard hand-off (readStoryboardHandoff('vfx-studio')) sets prompt and aspect ratio; removed GO-Viral hand-off claim (no vfx-studio reference in go-ai-viral).
- Noted no model selector (preset names only); prompt is appended to the preset (VFXGenerate.tsx generateVideo prompt composition).
- Removed 'Handoff not working: clear localStorage' troubleshooting; replaced with checks matched to real error messages.
- _Not confirmable in code (left out or stated generally):_
  - What the Personalization trigger shown beside the image is labelled, and what Enhance opens (rendered by shared components outside this studio).
  - Whether every effect honours Duration 10s or High quality (service-side behaviour).
  - Typical generation time (the studio polls up to about 15 minutes, useVideoGeneration.ts MAX_POLL_ATTEMPTS, but real time varies).
  - GO-Viral to VFX hand-off: not found in code, so not documented.

### VFX Studio (`vfx-studio`)
- Rewrote around the 2026-11-07 redesign: banner 'AI VFX Studio', sticky input panel (VfxInputBar.tsx) and card grid (VFXGenerate.tsx); category tabs 'AI Effects', 'Motion Controls', 'VFX' with counts (effectCatalog.ts VFX_CATEGORIES).
- Counts computed from effectCatalog.ts: AI_EFFECTS 64, MOTION_CONTROLS 47, VFX_EFFECTS 9 (python regex count of '{ id:' entries). The old FAQ said Motion Controls 64 and total 120, which was wrong (total is 120 = 64+47+9, motion is 47).
- Removed claim that VFX Studio accepts videos or 'effect parameters' (old useCases): input is one image only (VfxInputBar.tsx upload square accepts image/jpeg,png,webp; VFXGenerate.tsx:accept).
- Source image is required, effect required: error strings 'Select an effect first' and 'Upload an image or paste an image URL first' (VFXGenerate.tsx handleGenerate).
- Added paste-URL box, drag-and-drop, Remove image (VfxInputBar.tsx); URL must end in .jpg/.jpeg/.png/.webp (useVideoGeneration.ts isValidImageUrl).
- Settings are Aspect (9:16 Portrait/16:9 Landscape/1:1 Square), Duration (5s/10s), Size (480p/720p), Quality (Medium/High) with defaults 16:9, 5s, 480p, Medium (VfxInputBar.tsx options; VFXGenerate.tsx useState defaults).
- Upload limit 10 MB image from packages/studio/src/uploadContract.js UPLOAD_LIMITS.image via useVideoGeneration.ts validateFile.
- Result UI documented: progress window 'Generating your video...', 'Your video is ready!', result panel buttons Download, Copy URL, Post to social, Enhance, Regenerate, New Video (VFXGenerate.tsx).
- Handoff narrowed to what the code does: Storyboard hand-off (readStoryboardHandoff('vfx-studio')) sets prompt and aspect ratio; removed GO-Viral hand-off claim (no vfx-studio reference in go-ai-viral).
- Noted no model selector (preset names only); prompt is appended to the preset (VFXGenerate.tsx generateVideo prompt composition).
- Removed 'Handoff not working: clear localStorage' troubleshooting; replaced with checks matched to real error messages.
- _Not confirmable in code (left out or stated generally):_
  - What the Personalization trigger shown beside the image is labelled, and what Enhance opens (rendered by shared components outside this studio).
  - Whether every effect honours Duration 10s or High quality (service-side behaviour).
  - Typical generation time (the studio polls up to about 15 minutes, useVideoGeneration.ts MAX_POLL_ATTEMPTS, but real time varies).
  - GO-Viral to VFX hand-off: not found in code, so not documented.

### vibe-motion.changes (`vibe-motion.changes`)
- FIXED aspect ratios: old entry said 16:9 and 9:16 only; code offers 16:9, 9:16 and 1:1 (VibeMotionStudio.jsx:300).
- FIXED duration: old entry said "limited by backend"; code offers 5, 6, 8, 10, 12, 15, 20, 25, 30 seconds, default 6 (VibeMotionStudio.jsx:107, 301).
- REMOVED "native audio flag via skills recipe": no audio option or recipe code exists in VibeMotionStudio.jsx.
- FIXED edit mode: old entry said to use edit mode with a typed source request ID. In code you never type an ID: toggle Edit, pick a source under "Pick source…" / "Source Generation", or click the card remix button (VibeMotionStudio.jsx:408-425, 723-766). Edit is disabled until a generation with an ID exists (:597).
- ADDED button/placeholder labels from en/vibeMotionStudio.json (Generate/Edit toggle, Remix, Generating..., banner texts).
- ADDED stale remix message and automatic return to Generate mode (VibeMotionStudio.jsx:250-263; en errors.staleEditUnavailable).
- ADDED gallery behaviours: up to 30 entries in local storage, hover preview, click for fullscreen, download as .mp4, post button, delete with confirm (VibeMotionStudio.jsx:246, 363-531; SocialPublishProvider.tsx:227).
- ADDED Ctrl+Enter shortcut (VibeMotionStudio.jsx:291-293, 768).
- REMOVED claims not in code: transparency export, 3D remark, "replay" action.
- _Not confirmable in code (left out or stated generally):_
  - Cost/credits per generation: no cost hint in the UI code.
  - Whether the service honours the full duration range or supports transparency output: not in code.
  - Deleting a card calls setHistory directly (VibeMotionStudio.jsx:461) rather than saveHistory, so it may reappear after a reload; guide does not promise deletion persists.
  - Exact label of the Assist (sparkle) button on cards: icon-only, not described.

### Vibe Motion (`vibe-motion`)
- FIXED aspect ratios: old entry said 16:9 and 9:16 only; code offers 16:9, 9:16 and 1:1 (VibeMotionStudio.jsx:300).
- FIXED duration: old entry said "limited by backend"; code offers 5, 6, 8, 10, 12, 15, 20, 25, 30 seconds, default 6 (VibeMotionStudio.jsx:107, 301).
- REMOVED "native audio flag via skills recipe": no audio option or recipe code exists in VibeMotionStudio.jsx.
- FIXED edit mode: old entry said to use edit mode with a typed source request ID. In code you never type an ID: toggle Edit, pick a source under "Pick source…" / "Source Generation", or click the card remix button (VibeMotionStudio.jsx:408-425, 723-766). Edit is disabled until a generation with an ID exists (:597).
- ADDED button/placeholder labels from en/vibeMotionStudio.json (Generate/Edit toggle, Remix, Generating..., banner texts).
- ADDED stale remix message and automatic return to Generate mode (VibeMotionStudio.jsx:250-263; en errors.staleEditUnavailable).
- ADDED gallery behaviours: up to 30 entries in local storage, hover preview, click for fullscreen, download as .mp4, post button, delete with confirm (VibeMotionStudio.jsx:246, 363-531; SocialPublishProvider.tsx:227).
- ADDED Ctrl+Enter shortcut (VibeMotionStudio.jsx:291-293, 768).
- REMOVED claims not in code: transparency export, 3D remark, "replay" action.
- _Not confirmable in code (left out or stated generally):_
  - Cost/credits per generation: no cost hint in the UI code.
  - Whether the service honours the full duration range or supports transparency output: not in code.
  - Deleting a card calls setHistory directly (VibeMotionStudio.jsx:461) rather than saveHistory, so it may reappear after a reload; guide does not promise deletion persists.
  - Exact label of the Assist (sparkle) button on cards: icon-only, not described.

### video.changes (`video.changes`)
- Old steps: 'Choose a generation mode: text-to-video, image-to-video, video-to-video, or motion control' and 'Motion control models appear under the motion control category': Model picker tabs are All / Text to Video / Image to Video / Video Tools (messages/en/videoStudio.json categories); motion transfer is now a mode ('Transfer motion', modelControls.modes) .
- Old 'For V2V, a cost estimate may appear before you confirm' and 'set a seed' steps removed: grep for cost/estimate/credit in VideoStudio.jsx finds nothing; Seed appears only as a model option under Settings (messages fields.seed).
- Added video-mode menu (VideoStudio.jsx ~3235-3300, modelControls.modes + modeDescriptions), Speed button, Settings (Quality, Generation service under Advanced; VideoModelControls.jsx:156-190), Seedance/Veo tools (messages seedance.*, veo.*), Extend on Seedance 2.0 results (VideoStudio.jsx ~2735).
- Upload limits: image 10MB, video 50MB, audio 50MB (VideoStudio.jsx ~1852-1855 and ~1970-1973).
- Removed hard-coded model counts (90/131/36) and 'up to 30 images for seedance-2.5'.
- VideoStudioParity.jsx (Advanced panel with Negative Prompt/Seed controls from videoAdvancedControls.js) is not imported by any file, so its Advanced controls are not documented as available.
- _Not confirmable in code (left out or stated generally):_
  - Per-model durations, resolutions, aspect ratios and reference counts not enumerated.
  - Exact behaviour of Face swap and watermark removal outside the Seedance tool entry was not verified; Face Swap and Watermark Remover are documented under Edit Studio.
  - Whether 'Remove watermark' appears for the selected family depends on registered tool configuration; stated only for the Seedance video tools list.
  - Cost per generation not shown in the UI; not stated.

### Video Studio (`video`)
- Old steps: 'Choose a generation mode: text-to-video, image-to-video, video-to-video, or motion control' and 'Motion control models appear under the motion control category': Model picker tabs are All / Text to Video / Image to Video / Video Tools (messages/en/videoStudio.json categories); motion transfer is now a mode ('Transfer motion', modelControls.modes) .
- Old 'For V2V, a cost estimate may appear before you confirm' and 'set a seed' steps removed: grep for cost/estimate/credit in VideoStudio.jsx finds nothing; Seed appears only as a model option under Settings (messages fields.seed).
- Added video-mode menu (VideoStudio.jsx ~3235-3300, modelControls.modes + modeDescriptions), Speed button, Settings (Quality, Generation service under Advanced; VideoModelControls.jsx:156-190), Seedance/Veo tools (messages seedance.*, veo.*), Extend on Seedance 2.0 results (VideoStudio.jsx ~2735).
- Upload limits: image 10MB, video 50MB, audio 50MB (VideoStudio.jsx ~1852-1855 and ~1970-1973).
- Removed hard-coded model counts (90/131/36) and 'up to 30 images for seedance-2.5'.
- VideoStudioParity.jsx (Advanced panel with Negative Prompt/Seed controls from videoAdvancedControls.js) is not imported by any file, so its Advanced controls are not documented as available.
- _Not confirmable in code (left out or stated generally):_
  - Per-model durations, resolutions, aspect ratios and reference counts not enumerated.
  - Exact behaviour of Face swap and watermark removal outside the Seedance tool entry was not verified; Face Swap and Watermark Remover are documented under Edit Studio.
  - Whether 'Remove watermark' appears for the selected family depends on registered tool configuration; stated only for the Seedance video tools list.
  - Cost per generation not shown in the UI; not stated.

### workflows.changes (`workflows.changes`)
- Old guide described 'Drag nodes onto the canvas', 'API snippet generation', 'Requires SmartVideo GO entitlement' and 'workflow input schema inspection'; no API snippet UI or entitlement check exists in WorkflowStudio.jsx / WorkflowUI.jsx. Removed.
- Added list view labels from WorkflowStudio.jsx:889-985 (Workflows, Create Workflow, Templates, My Workflows, Community) and card menu Rename/Delete (lines 72-110) with confirm text (line 317).
- Added the Playground vs Full Workflow tabs (WorkflowStudio.jsx:511-529), Configuration form generation from input schema (lines 610-670), Run Workflow / Generating... / Running Pipeline / Workflow Results (lines 674-800), and Zen mode (Enter Zen Mode / Exit Zen / Play / Builder, lines 538-594).
- Documented that image/video playground inputs are text boxes and that keys starting text/image/video are wrapped as prompt/image_url/video_url (WorkflowStudio.jsx:443-450).
- Canvas labels taken from vendored packages/workflow-builder/src/components/NodeFlow.jsx (Run All, Publish/Unpublish, Save Workflow, Duplicate, lock message, presets dialog) and NodesNavbar.jsx (node menu groups and 'Search nodes or models').
- Old getting-started told users to 'Connect your SmartVideo GO studios' and 'Add conditional logic or branching'; not found in code, removed.
- _Not confirmable in code (left out or stated generally):_
  - Which node models appear in each canvas menu group: loaded from backend node schemas at runtime.
  - Content and titles of the starter presets shown under 'Select a Workflow' (come from the builder's preset data).
  - The Settings menu with Make Template / Category only shows when template.showTemplateBtn is true; the condition for that was not traced.
  - Billing/cost values shown next to Run All come from the builder's cost hook.

### Workflows (`workflows`)
- Old guide described 'Drag nodes onto the canvas', 'API snippet generation', 'Requires SmartVideo GO entitlement' and 'workflow input schema inspection'; no API snippet UI or entitlement check exists in WorkflowStudio.jsx / WorkflowUI.jsx. Removed.
- Added list view labels from WorkflowStudio.jsx:889-985 (Workflows, Create Workflow, Templates, My Workflows, Community) and card menu Rename/Delete (lines 72-110) with confirm text (line 317).
- Added the Playground vs Full Workflow tabs (WorkflowStudio.jsx:511-529), Configuration form generation from input schema (lines 610-670), Run Workflow / Generating... / Running Pipeline / Workflow Results (lines 674-800), and Zen mode (Enter Zen Mode / Exit Zen / Play / Builder, lines 538-594).
- Documented that image/video playground inputs are text boxes and that keys starting text/image/video are wrapped as prompt/image_url/video_url (WorkflowStudio.jsx:443-450).
- Canvas labels taken from vendored packages/workflow-builder/src/components/NodeFlow.jsx (Run All, Publish/Unpublish, Save Workflow, Duplicate, lock message, presets dialog) and NodesNavbar.jsx (node menu groups and 'Search nodes or models').
- Old getting-started told users to 'Connect your SmartVideo GO studios' and 'Add conditional logic or branching'; not found in code, removed.
- _Not confirmable in code (left out or stated generally):_
  - Which node models appear in each canvas menu group: loaded from backend node schemas at runtime.
  - Content and titles of the starter presets shown under 'Select a Workflow' (come from the builder's preset data).
  - The Settings menu with Make Template / Category only shows when template.showTemplateBtn is true; the condition for that was not traced.
  - Billing/cost values shown next to Run All come from the builder's cost hook.

### zackd.changes (`zackd.changes`)
- NEW entry: no zackd studio existed in studioKnowledgeBase.json. Tab id zackd with label Zack D Studio (components/StandaloneShell.js:111, 951).
- Six steps from STAGES: Topic, Script, Characters & keyframes, Motion clips, Voice & music, Final cut (ZackD.jsx:24-27, 449-453).
- Topic step: TOPIC field (max 200 chars), Write starter script / Rewrite starter script / Continue current project, four example topic cards, Templates section (ZackD.jsx:227-266; zackdPrompts.js:75-80).
- Starter script is a fixed 3-beat, 5-shot, 3 s per shot (about 15 s) skeleton, not an AI script (zackdPrompts.js:263-283 starterBeatMap; ZackD.jsx:213-217).
- Script step edit-only (narration and scene text, max 400 chars each), Approve script (ZackD.jsx:269-291).
- Looks: Plasticine clay, Translucent glass, Bright toy studio; sheets 16:9, keyframes 9:16; batch buttons with confirm; Approve keyframes disabled until all keyframes exist (ZackD.jsx:293-334; zackdPrompts.js:86-105).
- Clips with Veo 3.1 fast (fallback standard), 9:16, 720p, batch disabled until all keyframes exist (ZackD.jsx:336-359; jobs.js:32-33; zackdPrompts.js:24).
- Narration (12 preset voices, default Casual Guy, fixed speed 1.1) and optional music (zackdPrompts.js:67-72; ZackD.jsx:361-379).
- Final cut: browser render 720x1280 at 30 fps with 0.35 s transitions, keep clip audio checkbox, Cancel, Download video, Post to social, Captions (.srt), paid Burn captions (language, theme, $0.20 minimum, $0.005/s) (ZackD.jsx:381-434; finalCutPlan.js:2-8; zackdPrompts.js:30-65).
- Project is stored in local storage; the rendered video and captioned video are not persisted (ZackD.jsx:96-97, 111-113).
- Templates: Swallow gum finished demo, Swallow gum script only, Mosquito bite script only; loading never calls a paid API and keeps your look and voice (ZackD.jsx:205-211; templates.js).
- Template hand-off from the landing page seeds the topic (first 200 chars) when the topic is empty (ZackD.jsx:91, 107).
- _Not confirmable in code (left out or stated generally):_
  - Credit cost of images, clips, narration and music: only the captions price appears in the UI; no other prices are shown.
  - The guide does not claim character sheet images are fed into keyframe generation: keyframePrompt only uses the sheet text descriptions (zackdPrompts.js:227-243).
  - Exact quality/duration of the audio and music tracks: not in code beyond music length of total duration plus 5 seconds.
  - Which browsers can render MP4: code checks capabilities at runtime; guide only suggests Chrome or Edge as the code message does.
  - Whether any maximum project count exists: no code limit seen.

### Zack D Studio (`zackd`)
- NEW entry: no zackd studio existed in studioKnowledgeBase.json. Tab id zackd with label Zack D Studio (components/StandaloneShell.js:111, 951).
- Six steps from STAGES: Topic, Script, Characters & keyframes, Motion clips, Voice & music, Final cut (ZackD.jsx:24-27, 449-453).
- Topic step: TOPIC field (max 200 chars), Write starter script / Rewrite starter script / Continue current project, four example topic cards, Templates section (ZackD.jsx:227-266; zackdPrompts.js:75-80).
- Starter script is a fixed 3-beat, 5-shot, 3 s per shot (about 15 s) skeleton, not an AI script (zackdPrompts.js:263-283 starterBeatMap; ZackD.jsx:213-217).
- Script step edit-only (narration and scene text, max 400 chars each), Approve script (ZackD.jsx:269-291).
- Looks: Plasticine clay, Translucent glass, Bright toy studio; sheets 16:9, keyframes 9:16; batch buttons with confirm; Approve keyframes disabled until all keyframes exist (ZackD.jsx:293-334; zackdPrompts.js:86-105).
- Clips with Veo 3.1 fast (fallback standard), 9:16, 720p, batch disabled until all keyframes exist (ZackD.jsx:336-359; jobs.js:32-33; zackdPrompts.js:24).
- Narration (12 preset voices, default Casual Guy, fixed speed 1.1) and optional music (zackdPrompts.js:67-72; ZackD.jsx:361-379).
- Final cut: browser render 720x1280 at 30 fps with 0.35 s transitions, keep clip audio checkbox, Cancel, Download video, Post to social, Captions (.srt), paid Burn captions (language, theme, $0.20 minimum, $0.005/s) (ZackD.jsx:381-434; finalCutPlan.js:2-8; zackdPrompts.js:30-65).
- Project is stored in local storage; the rendered video and captioned video are not persisted (ZackD.jsx:96-97, 111-113).
- Templates: Swallow gum finished demo, Swallow gum script only, Mosquito bite script only; loading never calls a paid API and keeps your look and voice (ZackD.jsx:205-211; templates.js).
- Template hand-off from the landing page seeds the topic (first 200 chars) when the topic is empty (ZackD.jsx:91, 107).
- _Not confirmable in code (left out or stated generally):_
  - Credit cost of images, clips, narration and music: only the captions price appears in the UI; no other prices are shown.
  - The guide does not claim character sheet images are fed into keyframe generation: keyframePrompt only uses the sheet text descriptions (zackdPrompts.js:227-243).
  - Exact quality/duration of the audio and music tracks: not in code beyond music length of total duration plus 5 seconds.
  - Which browsers can render MP4: code checks capabilities at runtime; guide only suggests Chrome or Edge as the code message does.
  - Whether any maximum project count exists: no code limit seen.

## Product observations found during the review (not guide errors — for the owner to decide)

- **Social Publishing:** only the **Publish Now** button on the Destinations step sends a post; the *Review & Publish* step button and the footer Publish button do not call the API. Text typed in the Write step is not read by the publish request (title/caption come from what the studio hands over; a YouTube post without a title goes out as "Untitled"); the generated thumbnail is not sent.
- **Brand Studio:** brands are held in a server-memory store (can disappear after a restart); campaign generation reads the Supabase `brand_dna` table while Analyze stores in memory, so a freshly analyzed brand may not work for *Generate 4 Concepts* (unconfirmed). `/asset/[id]/edit` exists but nothing links to it.
- **Thumbnail Studio:** the eight style buttons fall back to the same generic phrase; *Refine last result* always uses flux-dev regardless of the selected model.
- **AI Influencer:** some option groups have no "none" choice, so default values (e.g. heterochromia, small horns, vitiligo) go into the prompt unless changed.
- **Clipping:** clicking a clip card does not play it (no player renders).
- **Audio:** the code enforces a 10 MB audio limit and mp3/wav/webm, while the on-screen hint says "MP3, WAV, M4A up to 20MB".
- **Agents:** inline chat/create views in `AgentStudio.jsx` read `params.tab` while the app routes with `slug`, so they may never be shown; the chat UI comes from the `ai-agent` package, whose source is not in this checkout.
- **Video:** `VideoStudioParity.jsx` is not imported anywhere (its Advanced controls are undocumented because users cannot reach them).
