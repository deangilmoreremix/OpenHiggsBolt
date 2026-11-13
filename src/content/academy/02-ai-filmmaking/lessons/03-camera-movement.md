# Camera Movement & Cinematography Prompts

> **Time:** about 16 minutes. **You will finish with:** one 4-5 second image-to-video clip with a deliberate camera move, tested at the right motion strength.

---

## Before you start

Beginners get a slideshow with slight Ken Burns effects, and a vague prompt like "the camera moves fast" makes models morph bodies or smear the background. Video models think in pixel displacement over time, not camera operators, so you control them with three tools: **first-frame conditioning** (your storyboard frame), **cinematography keywords** (dolly, pan, tilt) and **motion strength**. Formula: Start Frame (Storyboard) + Camera Direction Prompt + Motion Slider = Cinematic Shot. You will need a storyboard frame from lesson 2 (Storyboarding & Shot Planning), the library [`templates/motion-prompt-library.md`](templates/motion-prompt-library.md), the reference [`templates/cinematography-cheat-sheet.md`](templates/cinematography-cheat-sheet.md), and SmartVideo GO AI's **Video Studio** (image-to-video).

## Step by step

### 1. Pick your start frame

Choose one static storyboard image from lesson 2 at your target aspect ratio (16:9 or 2.39:1) and upload it to the image-to-video input in **Video Studio**. Menus move; follow the current screen.

**You should see:** your image shown as the start frame.

**If not:** if the aspect ratio is wrong, regenerate the still in **Image Studio** at the target ratio first.

### 2. Choose a camera move

Open [`templates/motion-prompt-library.md`](templates/motion-prompt-library.md) and pick the move that matches the shot's emotional goal. Put the camera phrase at the very beginning of the prompt:

```text
Slow dolly in, camera slowly pushes toward the astronaut's face, Arri Alexa cinematic style, 24fps.
```

**You should see:** a prompt that starts with the camera movement.

**If not:** if you only have vague words like "moves fast," swap them for dolly, pan, tilt, crane or track.

### 3. Set the motion strength

If your generator has a motion strength slider, choose by shot type:

1. **Low (1-3):** dialogue or subtle scenes, which prevents face warping while allowing blinks and head tilts.
2. **Medium (4-6):** camera pans, walking, panning b-roll.
3. **High (7-9):** fast action, running, driving.

**You should see:** a value set that fits your shot.

**If not:** if there is no slider, express the speed in the prompt ("slow, deliberate motion").

### 4. Render a 4-5 second clip and review

Generate the clip (the worked example used 16:9, 5 seconds). Watch for the **morphing zone**: bent background objects, extra fingers, clothing changes mid-shot. Also check pacing: smooth or jarring?

**You should see:** a clip where the face and costume stay consistent with the start frame.

**If not:** if it glitches, lower motion strength and re-render. If it is too static, rewrite the prompt so the camera direction is at the very start.

### 5. (Optional) Add a last frame

If you need a precise end point, upload a second storyboard image to the **Last-Frame Input** and describe the move between them:

```text
Camera pans left from the cockpit window to focus on the radar screen
```

**You should see:** a clip that begins on your first image and arrives at your second.

**If not:** if your generator has no last-frame input, skip this step; it is optional.

## Check yourself

* [ ] I used a storyboard frame as the start frame.
* [ ] My prompt begins with a proper camera term.
* [ ] I chose a motion strength that matches the shot type.
* [ ] I reviewed the clip for morphing and fixed or accepted it.

## Common mistakes

* Using vague motion words instead of dolly, pan, tilt or crane.
* Burying the camera direction at the end of the prompt.
* Too much motion strength on faces, which warps them.
* Skipping the review and building the edit on glitchy clips.

## Go further

**Worked example: Shot 1.2 of "The Last Signal."** Input: the static astronaut portrait. Prompt: `"Slow cinematic dolly in, camera pushes past glowing green console panels to focus on the tired eyes of the astronaut. Slow, deliberate motion, photorealistic film grain, 24fps."` Settings: 16:9, 5 seconds. Result: 0.0-1.5s the camera slides forward and panels leave frame, giving depth; 1.5-3.0s he blinks naturally and shadows match his face; 3.0-5.0s the camera rests on a tight close-up, face and suit consistent with the start frame. Cost: **$0.50** (1x Seedance 2 image-to-video fast call). Clip: [`templates/examples/astronaut-clip.mp4`](templates/examples/astronaut-clip.mp4).

**Exercises**

1. Easy: animate one landscape with three prompts (pan left, tilt up, dolly zoom) and note the pixel warping.
2. Medium: render one close-up at motion strength 2, 5 and 8 and log where features start to break down.
3. Hard: build a scene transition with first and last frame (indoor to outdoor), a continuous camera pass through a door.

**Compare tools.** Seedance 2 (via muapi): outstanding character and costume preservation using omni_reference first-frame conditioning, about $0.50 per 5-second clip, best for narrative continuity. Kling 3.0 / Luma Dream Machine: excellent camera tracking and micro-expressions, about $0.75-$0.80 per clip, for client work needing emotional realism. Runway Gen-3 Alpha: camera brush tools to paint direction vectors; subscription, credits burn fast. Local ComfyUI (LTX 2.3 / AnimateDiff): high control through nodes but heavy setup; free after GPU purchase, good for b-roll. Use API models like Seedance 2 for characters and local models for atmospheric b-roll.

**Launch it.** Package b-roll libraries (drone tracking over futuristic cities, macro pans, light rays) and sell on Adobe Stock, Shutterstock or Gumroad for **$15-$30** per pack, or sell tested camera prompt packs for **$10-$25** on Whop or Gumroad. Buyers: stock sites, indie game developers and other AI creators.

**Templates:** [`templates/motion-prompt-library.md`](templates/motion-prompt-library.md), [`templates/cinematography-cheat-sheet.md`](templates/cinematography-cheat-sheet.md).

Next: Assembling a Short Film.
