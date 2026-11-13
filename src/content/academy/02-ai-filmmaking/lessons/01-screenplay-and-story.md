# Screenplay & Story Generation

> **Time:** about 16 minutes. **You will finish with:** a short AI-friendly screenplay of about 5 shots, each with a ready-to-use visual prompt, plus a saved style prefix.

---

## Before you start

A normal screenplay breaks AI video models. A crowded café with spilled coffee gives morphing faces, glitchy physics and a hero who looks different in every shot, and you burn generation credits on clips you throw away. Writing with **AI-first constraints** from the start is the difference between a finished film and a folder of discarded clips. The constraints: the physics gap (pouring, tying shoes and eating look wrong), the crowd dilemma (more than two characters in frame hurts identity consistency), and continuous action limits (most models make 4-5 second clips, so long single takes are not feasible). You will need a text assistant such as Claude or Gemini, the templates [`templates/ai-film-brief.md`](templates/ai-film-brief.md) and [`templates/screenplay-prompt-template.md`](templates/screenplay-prompt-template.md), and SmartVideo GO AI's **Image Studio** and **Video Studio** for the optional test render. No prerequisites.

## Step by step

### 1. Set your production constraints

Open [`templates/ai-film-brief.md`](templates/ai-film-brief.md) and fill in:

1. **Max 1-2 characters**, to keep faces consistent.
2. **Max 2 locations** (for example a quiet office and a dimly lit street).
3. **A visual theme** (neon cyberpunk, dusty retro-future, noir daylight) to anchor your prompt styling.

**You should see:** a brief with characters, locations and one theme written down.

**If not:** if you have more than two characters or locations, cut the least important ones now. It is far cheaper than cutting later.

### 2. Ask an assistant for a first draft

Paste this into Claude or Gemini (change the genre or length if you like):

```text
You are an AI-first screenwriter. Write a 60-second sci-fi script. Only 1 character. Set entirely in a single room. Avoid any physical object interactions. Focus on facial expressions, slow camera tracking shots, and voiceover dialogue. For every scene, output a detailed visual prompt describing camera movement, framing, character appearance, and lighting.
```

**You should see:** a short script where every scene comes with a visual prompt.

**If not:** if the draft has crowds or lots of hand action, reply "Remove all physical interactions and keep one character" and ask again.

### 3. Prune the physical action

Read the draft line by line. Replace any multi-step action with a low-action version. For example, "He stands up, walks to the shelf, grabs a book, opens it, and smiles" becomes:

```text
He sits at the desk, looking at the shelf. [Camera pushes in on his face, showing curiosity]
```

**You should see:** characters mostly sitting or standing, with emotion shown on the face or in the mood of the room.

**If not:** look for verbs like pour, tie, eat, button, grab. Each one is a likely glitch.

### 4. Break it into 3-4 second shots

Use [`templates/screenplay-prompt-template.md`](templates/screenplay-prompt-template.md). Make each shot discrete (3-4 seconds), give it a visual action description of the character's expression or slow movement, and keep dialogue **under 15 words per shot** so text-to-speech reads it naturally.

**You should see:** about 5 numbered shots, each with an action line, a short voiceover line and a video prompt.

**If not:** if a shot needs more than one action, split it into two shots.

### 5. Save your style prefix

Write one reusable prefix (lighting, film stock, aspect ratio) and keep it in your brief, for example the one from the worked example below: "Static shot, high quality cinematic, Arri Alexa, film grain." You will paste it at the start of every image prompt in the next lesson.

**You should see:** one line of style text saved next to your character description.

**If not:** if your shots look inconsistent later, a missing or changing prefix is the usual cause.

### 6. Test one shot in SmartVideo GO AI

Open **Image Studio** and generate an anchor image from your Shot 1 prompt, then (optionally) animate it in **Video Studio** with image-to-video. Studio menus move; follow the current screen.

**You should see:** a still that matches your prompt, and optionally a short clip that keeps the same character and background.

**If not:** if the character looks wrong, add more specific details (age, hair, clothing) to the prompt and re-run the image before animating.

## Check yourself

* [ ] My brief limits the story to 1-2 characters and 2 locations.
* [ ] No shot needs complex physics, crowds or a long continuous action.
* [ ] Each shot lasts about 3-4 seconds and dialogue is under 15 words.
* [ ] Every shot has a visual prompt, and I saved a style prefix.

## Common mistakes

* Writing a normal script first and hoping the AI copes with the physics.
* Putting 3 or more characters in one frame.
* Long dialogue per shot, which makes text-to-speech rush.
* Describing physical struggle instead of the emotional reaction or the mood of the setting.

## Go further

**Worked example: "The Last Signal."** Character: John (40s), a tired astronaut. Location: spaceship communication deck. Vibe: cinematic sci-fi, moody blue lighting. Excerpt:

```text
SCENE 1: INTERIOR SPACE CABIN - NIGHT

John sits in a high-tech pilot seat, surrounded by glowing green instrument panels. Cool blue light washes over his face. He looks up at a flickering display monitor off-camera.

JOHN (V.O.)
"No one has answered in six months."

VIDEO PROMPT (Shot 1.1):
"Medium close-up of a tired astronaut (40s, short gray hair, stubble, wearing a worn silver flight suit) sitting in a spaceship cockpit. Glowing green instrument panels are out of focus in the background. Cool blue light illuminates his face. Static shot, high quality cinematic, Arri Alexa, film grain."
```

Why it works: low action (he only looks up), atmospheric lighting that gives the generator clear keys, and a voiceover (V.O.) so no perfect lip-sync is needed. The real example clip was made with `nano-banana-2` for the anchor image (text-to-image, $0.06/image) and `seedance-2-image-to-video-fast` (image-to-video, $0.50/clip), then converted to a GIF with ffmpeg. See [`templates/examples/astronaut-intro-clip.mp4`](templates/examples/astronaut-intro-clip.mp4).

**Exercises**

1. Easy: rewrite a 1-page movie script under AI-first constraints (1 location, 1 character, zero hand-object interactions).
2. Medium: write a 60-second thriller in 5 shots, with scene description, voiceover line and exact visual prompt for each.
3. Hard: have an LLM write three visual prompts for one scene, varying only the lens (85mm portrait, 24mm wide, anamorphic), and explain how each changes the mood.

**Compare tools.** Claude 3.5 Sonnet or Gemini 1.5 Pro follow complex structural constraints and output formatted prompts, so they suit overall script writing. Specialized screenplay tools give standard formats but are rigid and lack prompt generation. ChatGPT Plus (GPT-4o) is good for brainstorming and dialogue variants but needs heavy prompting to avoid cliches. General frontier LLMs with structured system prompts are the best path.

**Launch it.** Sell pre-production visual scripts and briefs (a formatted 1-minute script with storyboard prompt keys: **$50-$150**), or adapt a client's traditional script into an AI-optimised format (**$200-$500** per project). Find clients on AI creator forums, Discord servers and freelance sites under "Pre-Production Consultant" or "AI Scriptwriter."

**Templates:** [`templates/screenplay-prompt-template.md`](templates/screenplay-prompt-template.md), [`templates/ai-film-brief.md`](templates/ai-film-brief.md).

Next: Storyboarding & Shot Planning.
