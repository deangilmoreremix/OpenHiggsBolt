/**
 * Advanced, model-aware video controls for the VideoStudio "Advanced" panel.
 *
 * Research basis (muapi.ai capability docs, 2026):
 *  - Seedance 2.0/2.1/2.5: negative_prompt, seed, generate_audio (native audio),
 *    camera_fixed, bitrate_mode (standard/high), output_format (mp4/mov),
 *    watermark, return_last_frame. 2.5 also supports up to 30 reference images /
 *    10 videos / 10 audio via the omni-reference endpoints.
 *  - Kling (v3.0 + Omni): negative_prompt, seed, cfg_scale (0–1),
 *    enable_sound (native audio) and a structured camera_control object
 *    (preset type + 6 axes: horizontal/vertical/pan/tilt/roll/zoom, each -10..10).
 *  - Veo 3 / veo3-fast: negative_prompt, seed, generate_audio.
 *  - Wan / Hunyuan / Runway / PixVerse / Vidu / MiniMax / LTX: negative_prompt, seed.
 *
 * These layer on top of the base model.inputs (prompt, aspect_ratio, duration,
 * resolution, quality, mode) and are rendered generically in VideoStudio.
 */

export const ADVANCED_CONTROLS = {
  negative_prompt: {
    label: "Negative Prompt",
    type: "textarea",
    default: "",
    description: "What to avoid in the output.",
  },
  seed: {
    label: "Seed",
    type: "int",
    default: -1,
    min: -1,
    max: 4294967295,
    step: 1,
    description: "Use -1 for random. Same seed → similar output.",
  },
  generate_audio: {
    label: "Generate Audio",
    type: "boolean",
    default: true,
    description: "Natively synthesize audio (ambient/SFX/lip-sync) with the clip.",
  },
  camera_fixed: {
    label: "Lock Camera",
    type: "boolean",
    default: false,
    description: "Bias the model toward a locked-off (static) camera.",
  },
  bitrate_mode: {
    label: "Bitrate Mode",
    type: "enum",
    default: "high",
    enum: ["standard", "high"],
    description: "standard = CRF 18, high = CRF 11 (larger, finer detail).",
  },
  output_format: {
    label: "Output Format",
    type: "enum",
    default: "mp4",
    enum: ["mp4", "mov"],
    description: "mp4 (standard) or mov (yuv444p — better for editing/extend).",
  },
  watermark: {
    label: "Watermark",
    type: "boolean",
    default: false,
    description: "Keep the visible watermark on the output.",
  },
  return_last_frame: {
    label: "Return Last Frame",
    type: "boolean",
    default: false,
    description: "Also return the final frame (PNG) for chaining generations.",
  },
  cfg_scale: {
    label: "CFG Scale",
    type: "number",
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.05,
    description: "Guidance scale (0–1). Higher = stricter prompt adherence.",
  },
  enable_sound: {
    label: "Enable Sound",
    type: "boolean",
    default: true,
    description: "Generate native audio for the clip (Kling).",
  },
  camera_control_type: {
    label: "Camera Move",
    type: "enum",
    default: "simple",
    enum: ["simple", "down_back", "forward_up", "right_turn_forward", "left_turn_forward"],
    description: "Preset camera-path choreography (Kling).",
  },
  camera_horizontal: { label: "Cam Horizontal", type: "int", default: 0, min: -10, max: 10, step: 1 },
  camera_vertical: { label: "Cam Vertical", type: "int", default: 0, min: -10, max: 10, step: 1 },
  camera_pan: { label: "Cam Pan", type: "int", default: 0, min: -10, max: 10, step: 1 },
  camera_tilt: { label: "Cam Tilt", type: "int", default: 0, min: -10, max: 10, step: 1 },
  camera_roll: { label: "Cam Roll", type: "int", default: 0, min: -10, max: 10, step: 1 },
  camera_zoom: { label: "Cam Zoom", type: "int", default: 0, min: -10, max: 10, step: 1 },
};

// Which advanced controls apply to which provider (model.provider).
const PROVIDER_CONTROLS = {
  bytedance: ["negative_prompt", "seed", "generate_audio", "camera_fixed", "bitrate_mode", "output_format", "watermark", "return_last_frame"],
  kling: ["negative_prompt", "seed", "cfg_scale", "enable_sound", "camera_control_type", "camera_horizontal", "camera_vertical", "camera_pan", "camera_tilt", "camera_roll", "camera_zoom"],
  google: ["negative_prompt", "seed", "generate_audio"],
  _default: ["negative_prompt", "seed"],
};

// Version-specific tweaks where muapi support differs per model id.
const MODEL_OVERRIDES = {
  "kling-v2.1-master-t2v": { remove: ["cfg_scale", "enable_sound"] },
  "kling-v2.5-turbo-pro-t2v": { remove: ["cfg_scale", "enable_sound"] },
  "kling-v2.6-pro-t2v": { remove: ["cfg_scale", "enable_sound"] },
  "kling-o1-text-to-video": { remove: ["enable_sound"] },
};

export function getAdvancedControlsForModel(model) {
  if (!model) return [];
  const base = PROVIDER_CONTROLS[model.provider] || PROVIDER_CONTROLS._default;
  let keys = [...base];
  const override = MODEL_OVERRIDES[model.id];
  if (override?.remove) keys = keys.filter((k) => !override.remove.includes(k));
  if (override?.add) keys = [...keys, ...override.add];
  return keys
    .map((k) => ({ key: k, ...ADVANCED_CONTROLS[k] }))
    .filter((c) => !!c.type);
}

/**
 * Build the payload fragment from current advanced values, omitting defaults and
 * assembling Kling's nested `camera_control` object from the flat cam_* fields.
 * Returns an object containing only advanced keys (no base fields).
 */
export function buildAdvancedPayload(controls, values) {
  const payload = {};
  if (!controls || !values) return payload;

  for (const c of controls) {
    // Camera-axis + preset fields are assembled into `camera_control` below; skip here.
    // IMPORTANT: `camera_fixed` is a distinct lock-camera boolean, NOT a camera axis — do not skip it.
    if (
      c.key === "camera_control_type" ||
      /^camera_(horizontal|vertical|pan|tilt|roll|zoom)$/.test(c.key)
    ) continue;

    const v = values[c.key];
    if (v === undefined || v === null || v === "") continue;

    if (c.type === "boolean") {
      if (v !== c.default) payload[c.key] = v;
      continue;
    }
    if (c.type === "int" || c.type === "number") {
      const num = Number(v);
      if (c.key === "seed") {
        if (num !== -1) payload[c.key] = num;
        continue;
      }
      if (num !== c.default) payload[c.key] = num;
      continue;
    }
    if (c.type === "enum") {
      if (v !== c.default) payload[c.key] = v;
      continue;
    }
    // string / textarea
    if (v !== "" && v !== c.default) payload[c.key] = v;
  }

  // Assemble Kling camera_control from flat cam_* fields + preset type.
  const camAxes = ["horizontal", "vertical", "pan", "tilt", "roll", "zoom"];
  const camConfig = {};
  let camTouched = false;
  for (const axis of camAxes) {
    const def = ADVANCED_CONTROLS[`camera_${axis}`];
    const val = values[`camera_${axis}`];
    if (val !== undefined && val !== null && Number(val) !== def.default) {
      camConfig[axis] = Number(val);
      camTouched = true;
    }
  }
  const camType = values.camera_control_type;
  if (camType && camType !== "simple") camTouched = true;
  if (camTouched) {
    payload.camera_control = { type: camType || "simple", config: camConfig };
  }

  return payload;
}
