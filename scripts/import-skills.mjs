import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC_ROOT = join(ROOT, "packages", "studio", "src", "skills", "source");
const OUT = join(ROOT, "packages", "studio", "src", "skills", "registry.json");

const STUDIO_MAP = {
  visual: "image",
  motion: "video",
  social: "marketing",
  edit: "image",
  workflow: "workflows",
};

const KNOWN_WORKFLOW_SLUGS = new Set([
  "muapi-ugc-ads-workflow",
  "muapi-youtube-shorts",
  "muapi-product-campaign",
  "muapi-social-pack",
  "muapi-storyboard-to-cooking-video",
]);

const HARDCODED = {
  "muapi-ugc-ads-workflow": {
    inputs: [
      { name: "product_name", type: "text", required: true, default: "" },
      { name: "human_image", type: "image_url", required: false, default: "" },
      { name: "product_image", type: "image_url", required: false, default: "" },
    ],
    steps: [
      {
        type: "image",
        model: "gpt-image-2-text-to-image",
        endpoint: "gpt-image-2-text-to-image",
        aspectRatio: "9:16",
        prompt:
          "A natural, candid UGC-style photo of the influencer from the first reference image holding and showcasing the product from the second reference image. Smiling genuinely at the camera, natural indoor lighting, lifestyle aesthetic, high quality.",
        references: ["{{human_image}}", "{{product_image}}"],
      },
      { type: "approval", note: "Approve the combined image before animating." },
      {
        type: "i2v",
        model: "sd-2-omni-reference",
        endpoint: "sd-2-omni-reference",
        aspectRatio: "9:16",
        prompt:
          "A UGC-style video. The influencer holds the {{product_name}}, smiling genuinely. Brings it closer to the camera, then applies it smoothly. Nods in approval and smiles. Natural movements, talking to the camera, lifestyle vlog style.",
        references: ["{{phase0.output}}"],
      },
    ],
  },
  "muapi-youtube-shorts": {
    inputs: [
      { name: "source_video", type: "image_url", required: true, default: "", label: "Video URL" },
    ],
    steps: [
      { type: "upload", inputName: "source_video", note: "Use the long-form video URL as the source." },
      {
        type: "clipping",
        model: "ai-clipping",
        endpoint: "ai-clipping",
        aspectRatio: "9:16",
        prompt: "Extract the most viral 9:16 highlights ranked by virality.",
        references: ["{{source_video}}"],
      },
    ],
  },
  "muapi-product-campaign": {
    inputs: [{ name: "product_name", type: "text", required: true, default: "" }],
    steps: [
      {
        type: "image",
        model: "nano-banana",
        endpoint: "nano-banana",
        aspectRatio: "1:1",
        prompt:
          "A clean minimalist product shot of {{product_name}} on a soft gradient background, studio lighting, high detail.",
        references: [],
      },
      {
        type: "i2v",
        model: "sd-2-omni-reference",
        endpoint: "sd-2-omni-reference",
        aspectRatio: "9:16",
        prompt:
          "Slow cinematic push-in on {{product_name}}, elegant motion, premium feel.",
        references: ["{{phase0.output}}"],
      },
    ],
  },
  "muapi-social-pack": {
    inputs: [{ name: "product_name", type: "text", required: true, default: "" }],
    steps: [
      {
        type: "image",
        model: "nano-banana",
        endpoint: "nano-banana",
        aspectRatio: "1:1",
        prompt: "Instagram square post for {{product_name}}, vibrant, on-trend aesthetic.",
        references: [],
      },
      {
        type: "image",
        model: "nano-banana",
        endpoint: "nano-banana",
        aspectRatio: "9:16",
        prompt: "TikTok/Reels vertical post for {{product_name}}, dynamic, eye-catching.",
        references: [],
      },
    ],
  },
  "muapi-storyboard-to-cooking-video": {
    inputs: [{ name: "topic", type: "text", required: true, default: "" }],
    steps: [
      { type: "script", note: "Write a shot list / storyboard for: {{topic}}." },
      {
        type: "i2v",
        model: "sd-2-omni-reference",
        endpoint: "sd-2-omni-reference",
        aspectRatio: "16:9",
        prompt:
          "Cinematic cooking sequence: {{topic}}. Smooth camera moves, appetizing lighting.",
        references: [],
      },
    ],
  },
};

function parseFrontmatter(text) {
  const fm = {};
  const m = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return { fm, body: text };
  const body = text.slice(m.index + m[0].length);
  for (const raw of m[1].split("\n")) {
    const line = raw.trimEnd();
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return { fm, body };
}

function parseInputs(body) {
  const inputs = [];
  const lines = body.split("\n");
  let inInputs = false;
  for (const line of lines) {
    if (/^##\s+Inputs/i.test(line)) {
      inInputs = true;
      continue;
    }
    if (inInputs && /^##\s+/.test(line)) break;
    if (!inInputs) continue;
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cells.length < 3) continue;
    const name = cells[0].replace(/`/g, "");
    const typeRaw = cells[1].replace(/`/g, "").toLowerCase();
    if (name === "Name" || name.startsWith(":") || /^-+$/.test(name.replace(/-/g, "")))
      continue;
    if (/^-+$/.test(cells[1].replace(/-/g, "")) && /^-+$/.test(cells[0].replace(/-/g, "")))
      continue;
    const type = typeRaw.includes("image") ? "image_url" : "text";
    const required = !/^(no|false|optional)$/i.test(cells[2].replace(/`/g, ""));
    let def = cells[3] ? cells[3].replace(/`/g, "") : "";
    if (def === "—" || def === "-" || def === "") def = "";
    inputs.push({ name, type, required, default: def });
  }
  return inputs;
}

function findModelAlias(body) {
  const m = body.match(/model=`?([a-z0-9.\-]+)`?/i);
  if (m) return m[1];
  const b = body.match(/`([a-z0-9][a-z0-9.\-]+)`/);
  if (b) return b[1];
  return "";
}

function findAspectRatio(body) {
  const m = body.match(/\b(\d+:\d+)\b/);
  return m ? m[1] : "";
}

function findPrompt(body, description) {
  const lines = body.split("\n");
  for (const line of lines) {
    if (/prompt:/i.test(line)) {
      const m = line.match(/`([^`]+)`/);
      if (m) return m[1].trim();
      const stripped = line.replace(/^.*prompt:/i, "").trim();
      if (stripped) return stripped;
    }
  }
  for (const line of lines) {
    const m = line.match(/`([^`]{8,})`/);
    if (m) return m[1].trim();
  }
  return description || "";
}

function parseTriggers(body) {
  const lines = body.split("\n");
  let inSection = false;
  const out = [];
  for (const line of lines) {
    if (/^##\s+Trigger Keywords/i.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && /^##\s+/.test(line)) break;
    if (!inSection) continue;
    const t = line.trim();
    if (!t || /^-+$/.test(t) || t === "---") continue;
    for (const part of t.split(/[`,]/)) {
      const p = part.trim();
      if (p) out.push(p);
    }
  }
  return out;
}

function findPromptFormula(body) {
  if (!/(perfect prompt|formula)/i.test(body)) return "";
  const m = body.match(
    /([A-Za-z][A-Za-z+ &]{5,60}?\+ [A-Za-z][A-Za-z ]{2,40}\+ [A-Za-z][A-Za-z ]{2,40}\+ [A-Za-z][A-Za-z ]{2,40}\+ [A-Za-z][A-Za-z ]{2,40})/
  );
  return m ? m[1].trim() : "";
}

function deriveStep(skill) {
  const body = skill.body;
  const alias = findModelAlias(body);
  const type =
    /image-to-video/i.test(body) || /omni/i.test(alias) || /i2v/i.test(alias)
      ? "i2v"
      : "image";
  const model = alias || skill.fm.slug || "";
  const endpoint = model || skill.fm.slug || "";
  return [
    {
      type,
      model,
      endpoint,
      aspectRatio: findAspectRatio(body),
      prompt: findPrompt(body, skill.fm.description || ""),
      references: [],
    },
  ];
}

function walkCategories(rootDir) {
  const result = [];
  for (const cat of readdirSync(rootDir)) {
    const catPath = join(rootDir, cat);
    if (!statSync(catPath).isDirectory()) continue;
    if (cat === "schema_data.json") continue;
    for (const skillName of readdirSync(catPath)) {
      const skillPath = join(catPath, skillName);
      if (!statSync(skillPath).isDirectory()) continue;
      const skillFile = join(skillPath, "SKILL.md");
      try {
        const text = readFileSync(skillFile, "utf8");
        result.push({ category: cat, skillName, text });
      } catch {
        /* skip */
      }
    }
  }
  return result;
}

function main() {
  const failures = [];
  const skills = [];

  for (const entry of walkCategories(SRC_ROOT)) {
    const { fm, body } = parseFrontmatter(entry.text);
    const slug = fm.slug || fm.name || entry.skillName;
    const name = fm.name || slug;
    const category = entry.category;
    const studio = STUDIO_MAP[category] || category;
    const kind =
      category === "workflow" || KNOWN_WORKFLOW_SLUGS.has(slug)
        ? "workflow"
        : "recipe";

    let inputs = [];
    let steps = [];

    if (KNOWN_WORKFLOW_SLUGS.has(slug) && HARDCODED[slug]) {
      inputs = HARDCODED[slug].inputs;
      steps = HARDCODED[slug].steps;
    } else {
      inputs = parseInputs(body);
      steps = deriveStep({ fm, body });
    }

    const triggers = parseTriggers(body);
    const promptFormula = findPromptFormula(body);

    if (!fm.slug && !fm.name) failures.push(slug);

    skills.push({
      slug,
      name,
      description: fm.description || "",
      category,
      studio,
      kind,
      inputs,
      steps,
      triggers,
      promptFormula,
    });
  }

  skills.sort((a, b) => a.slug.localeCompare(b.slug));

  const registry = {
    generatedAt: new Date().toISOString(),
    skillCount: skills.length,
    skills,
  };

  writeFileSync(OUT, JSON.stringify(registry, null, 2));

  const workflowCount = skills.filter((s) => s.kind === "workflow").length;
  console.log("skillCount:", registry.skillCount);
  console.log("workflowCount:", workflowCount);
  if (failures.length) console.log("failed:", failures.join(", "));
}

main();
