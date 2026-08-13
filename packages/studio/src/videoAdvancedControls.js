/**
 * Advanced, model-aware video controls for the VideoStudio "Advanced" panel.
 *
 * ACCURACY NOTE (muapi.ai simplified/unified endpoint audit, 2026):
 * muapi's SIMPLIFIED endpoint accepts a minimal, model-specific param set.
 * Many "advanced" controls live only on the NATIVE provider API and are NOT
 * forwarded by the simplified layer (and may even 400 if sent). So this module
 * is scoped to what the simplified endpoint actually accepts, per model id:
 *  - "Most T2V models accept" (generic doc): negative_prompt, seed.
 *  - Seedance 2.5/2.x: omni-reference (images_list ≤30 / videos_list ≤10 /
 *    audios_list ≤10), first/last frame (images_list:[first,last]),
 *    ratio_adaptive (native `ratio`), plus 2.x-only camera_fixed/bitrate_mode/
 *    output_format/watermark/return_last_frame/generate_audio (Edit/Extend).
 *  - Kling 3.0 / 3.0 Omni: cfg_scale, enable_sound, camera_control (native-only,
 *    scoped to 3.x — older Kling drops them); Omni adds reference_image_urls
 *    (≤4), multi_prompt (≤6), multi_shots. negative_prompt is NOT accepted on 3.0.
 *  - Veo 3/3.1: negative_prompt + seed only (no audio toggle on simplified).
 *  - Wan: quality, shot_type; Wan 2.6: audio_url. PixVerse v6: generate_audio_switch.
 *  - LTX: seed. Runway/Hunyuan/Vidu/MiniMax: negative_prompt + seed only.
 *  - webhook_url is a query param, not a body field — intentionally excluded.
 *
 * These layer on top of the base model.inputs (prompt, aspect_ratio, duration,
 * resolution, quality, mode) and are rendered generically.
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
  // ── Seedance 2.5/2.x-only (native-supported, scoped to 2.x models) ──
  generate_audio: {
    label: "Generate Audio",
    type: "boolean",
    default: true,
    description: "Natively synthesize audio (ambient/SFX/lip-sync). Edit/Extend endpoints.",
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
  ratio_adaptive: {
    label: "Adaptive Ratio",
    type: "boolean",
    default: false,
    description: "Seedance 2.5: let the model pick the best ratio (native `ratio`).",
  },
  // ── Kling 3.x-only (native-supported) ──
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
    description: "Preset camera-path choreography (Kling, native).",
  },
  camera_horizontal: { label: "Cam Horizontal", type: "int", default: 0, min: -10, max: 10, step: 1 },
  camera_vertical: { label: "Cam Vertical", type: "int", default: 0, min: -10, max: 10, step: 1 },
  camera_pan: { label: "Cam Pan", type: "int", default: 0, min: -10, max: 10, step: 1 },
  camera_tilt: { label: "Cam Tilt", type: "int", default: 0, min: -10, max: 10, step: 1 },
  camera_roll: { label: "Cam Roll", type: "int", default: 0, min: -10, max: 10, step: 1 },
  camera_zoom: { label: "Cam Zoom", type: "int", default: 0, min: -10, max: 10, step: 1 },

  // ── Reference media (on simplified schema for these endpoints) ──
  images_list: {
    label: "Reference Images (URLs)",
    type: "url_list",
    default: "",
    maxItems: 30,
    description: "One URL per line. Seedance 2.5 Omni: up to 30.",
  },
  videos_list: {
    label: "Reference Videos (URLs)",
    type: "url_list",
    default: "",
    maxItems: 10,
    description: "One URL per line. Up to 10.",
  },
  audios_list: {
    label: "Reference Audio (URLs)",
    type: "url_list",
    default: "",
    maxItems: 10,
    description: "One URL per line. Up to 10.",
  },
  reference_image_urls: {
    label: "Reference Images (Kling Omni)",
    type: "url_list",
    default: "",
    maxItems: 4,
    description: "Up to 4 image URLs, one per line.",
  },
  multi_prompt: {
    label: "Multi-shot Prompts",
    type: "textarea",
    default: "",
    description: "Kling Omni: one prompt per line (max 6 shots).",
  },
  multi_shots: { label: "Multi Shots", type: "boolean", default: false },
  first_frame: { label: "First Frame URL", type: "url", default: "" },
  last_frame: { label: "Last Frame URL", type: "url", default: "" },
  audio_url: { label: "Audio URL", type: "url", default: "" },

  // ── Model-specific simple controls ──
  shot_type: {
    label: "Shot Type",
    type: "enum",
    default: "single",
    enum: ["single", "multi"],
  },
  generate_audio_switch: { label: "Generate Audio", type: "boolean", default: false },
};

// Base controls per provider (the generic "most T2V models accept" set).
const PROVIDER_CONTROLS = {
  bytedance: ["negative_prompt", "seed"],
  kling: ["negative_prompt", "seed"],
  google: ["negative_prompt", "seed"],
  _default: ["negative_prompt", "seed"],
};

// Per-model id rules that ADD/REMOVE controls. Applied in order against
// model.id. This is what makes the audit version-accurate and prevents
// over-exposing native-only params to models that don't support them.
const MODEL_RULES = [
  // Seedance 2.5 / 2.x family: 2.x-only controls are native-supported.
  {
    match: /^seedance-2\.5|^seedance-2(-|$)|^seedance-2-vip/,
    add: ["camera_fixed", "bitrate_mode", "output_format", "watermark", "return_last_frame", "generate_audio", "ratio_adaptive"],
  },
  // Seedance omni-reference endpoints.
  { match: /omni-reference/, add: ["images_list", "videos_list", "audios_list"] },
  // Seedance first/last-frame endpoints.
  { match: /first-last-frame/, add: ["first_frame", "last_frame"] },
  // Kling 3.0 / 3.0 Omni: native-only but scoped to 3.x (older Kling drops them).
  {
    match: /kling-v3|kling-3/,
    add: ["cfg_scale", "enable_sound", "camera_control_type", "camera_horizontal", "camera_vertical", "camera_pan", "camera_tilt", "camera_roll", "camera_zoom"],
    remove: ["negative_prompt"],
  },
  // Kling 3.0 Omni: reference + multi-shot.
  { match: /kling-3.*omni|kling-v3.*omni/, add: ["reference_image_urls", "multi_prompt", "multi_shots"] },
  // Older Kling: drop 3.x-only controls.
  {
    match: /kling-v2\.1-master|kling-v2\.5-turbo-pro|kling-v2\.6-pro|kling-o1/,
    remove: ["cfg_scale", "enable_sound"],
  },
  // Wan.
  { match: /^wan/, add: ["quality", "shot_type"] },
  { match: /wan2\.6/, add: ["audio_url"] },
  // PixVerse v6 audio toggle.
  { match: /pixverse-v6/, add: ["generate_audio_switch"] },
];

export function getAdvancedControlsForModel(model) {
  if (!model) return [];
  const base = PROVIDER_CONTROLS[model.provider] || PROVIDER_CONTROLS._default;
  let keys = [...base];
  const id = model.id || "";
  for (const rule of MODEL_RULES) {
    if (new RegExp(rule.match).test(id)) {
      if (rule.add) keys.push(...rule.add);
      if (rule.remove) keys = keys.filter((k) => !rule.remove.includes(k));
    }
  }
  keys = [...new Set(keys)];
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
    // `camera_fixed` is a distinct lock-camera boolean, NOT a camera axis — do not skip it.
    if (
      c.key === "camera_control_type" ||
      /^camera_(horizontal|vertical|pan|tilt|roll|zoom)$/.test(c.key)
    ) continue;
    // Handled in the post-loop assembly below.
    if (c.key === "first_frame" || c.key === "last_frame" || c.key === "multi_prompt" || c.key === "ratio_adaptive") continue;

    const v = values[c.key];
    if (v === undefined || v === null || v === "") continue;

    if (c.type === "url_list") {
      const arr = String(v)
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, c.maxItems || 999);
      if (arr.length) payload[c.key] = arr;
      continue;
    }
    if (c.type === "url") {
      payload[c.key] = v;
      continue;
    }
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

  // First/last frame → images_list:[first, last] (Seedance first-last endpoints).
  const ff = values.first_frame;
  const lf = values.last_frame;
  if (ff || lf) payload.images_list = [ff, lf].filter(Boolean);

  // Multi-shot prompts → array (max 6).
  if (values.multi_prompt) {
    const arr = String(values.multi_prompt)
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
    if (arr.length) payload.multi_prompt = arr;
  }

  // Adaptive ratio (Seedance 2.5 native `ratio` field).
  if (values.ratio_adaptive) payload.ratio = "adaptive";

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
