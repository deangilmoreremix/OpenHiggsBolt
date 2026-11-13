# Video Models — Which One for Which Use Case

> **Time:** about 15 minutes. **You will finish with:** a video model chosen for your scene, a camera motion prompt and a motion strength setting.

---

## Before you start

Video credits cost $0.25 to $1.50 per 5-second generation, so the wrong model wastes money. High-motion models on subtle pans cause morphing distortion, low-motion models on action give frozen frames, and Text-to-Video (T2V) instead of Image-to-Video (I2V) breaks consistency across scenes. Judge models on four factors: I2V fidelity (**Kling 1.5** / **Seedance 2 I2V**), camera controls (**Runway Gen-3 Alpha** / **Luma Dream Machine**), physics and fluid motion (**Kling 1.5** / **Sora**), and speed (**Seedance 2 I2V Fast** via muapi, about 10-30 seconds).

You will need a source image (finish lesson 1 first) and the template [`templates/video-audio-stack-matrix.md`](templates/video-audio-stack-matrix.md). In SmartVideo GO AI you will use **Video Studio**.

## Step by step

### 1. Open the motion matrix

Open [`templates/video-audio-stack-matrix.md`](templates/video-audio-stack-matrix.md).

**You should see:** motion control parameters, camera movement guides and model speed benchmarks.

**If not:** check the link path as written, or use the Compare Tools table in Go further.

### 2. Map your scene to a model

Pick the line that matches your scene:

1. Subtle slow architectural pan or product rotation needs high I2V stability: **Kling 1.5 / Seedance 2 I2V**.
2. Dramatic cinematic zoom or fly-through needs keyframe camera control: **Runway Gen-3 Alpha**.
3. Complex fluids such as water splashes or explosions need advanced physics: **Kling 1.5 / Sora**.

**You should see:** one model written down for your scene.

**If not:** if the scene mixes needs, split it into separate shots.

### 3. Start from an image

Choose or generate your source image first (see lesson 1). Always begin with I2V, never T2V, for commercial work.

**You should see:** one pristine keyframe image ready to animate.

**If not:** if the image has flaws, fix them in **Image Studio** first; video will amplify them.

### 4. Write the motion prompt

Add explicit camera movement words. Use this as a model:

```text
Camera slowly pans right across the modern living room, soft sunlight streaming through windows, 24fps film grain, photorealistic.
```

**You should see:** a prompt naming the camera move, the light and the look.

**If not:** if the prompt names no camera move, add one (pan, push-in or orbit).

### 5. Set the motion strength

Set the scale: low motion (`2 - 4`) for portraits, headshots and real estate; high motion (`6 - 8`) for action, sports and vehicles.

**You should see:** a number that fits your scene type.

**If not:** menus move; follow the current screen and look for a motion or strength control.

### 6. Generate in Video Studio and check

Open **Video Studio**, upload your image, paste the prompt, set the motion and generate.

**You should see:** a clip where the subject keeps its shape and lighting.

**If not:** if the subject morphs, lower the motion strength or switch to the model with better I2V stability.

## Check yourself

* [ ] I mapped my scene to a model by motion profile.
* [ ] I started from an image, not from text alone.
* [ ] My prompt names a camera move.
* [ ] My motion strength matches the scene (2-4 low, 6-8 high).

## Common mistakes

* Using T2V for commercial work, so the subject changes shape.
* High motion on subtle pans, which morphs the subject.
* Low motion on action, which freezes the frame.
* Animating a flawed image instead of fixing it first.

## Go further

**Worked example: "Commercial Car Reel."** Requirement: 5-second tracking shot of a sports car on a coastal road at sunset. T2V morphed the car into a different vehicle halfway. I2V with Kling 1.5 / Seedance 2 locked the vehicle geometry from the keyframe and gave smooth chassis reflections. Result: 100% stable motion reel. Visual: `templates/examples/camera-motion-matrix.jpg`.

| Video model | Camera control | Motion fidelity | Best for |
|---|---|---|---|
| **Runway Gen-3 Alpha** | Extremely high (keyframe camera controls) | High | Film trailers, dramatic camera moves, advertising |
| **Kling 1.5** | High | Superior physics and human motion | Real estate walkthroughs, character motion, I2V stability |
| **Luma Dream Machine** | Medium | High dynamic camera movement | Fast 3D camera sweeps, conceptual loops |
| **Seedance 2 I2V Fast (muapi API)** | High | Fastest API inference (about 15s) | High-volume client pipelines, social clips |

Exercises:

1. **Easy:** animate a static product photo with Seedance 2 I2V and a slow camera zoom prompt.
2. **Medium:** compare Runway Gen-3 vs. Kling 1.5 camera control on the same keyframe.
3. **Hard:** produce a 3-shot scene with consistent lighting using I2V keyframes across scenes.

Template: [`templates/video-audio-stack-matrix.md`](templates/video-audio-stack-matrix.md).

Other SmartVideo GO AI studios that use this: Image Studio (anchors, product shots), AI Influencer Studio, Storyboard / Campaign Planner, Lip-Sync Studio.

Next: Voice/Audio Models — Which One for Which Use Case.
