#!/usr/bin/env node
// Backfill provider / provider_name fields into this repo's models.js from
// upstream's models.js, matched on model id. Idempotent: skips entries that
// already carry the fields. Inserts the two fields immediately after each
// `"id": "..."` line in the target file (per occurrence, so duplicate ids are
// each handled).
//
// Usage: node backfill-providers.mjs <upstream-models.js> <target-models.js>

import { readFileSync, writeFileSync } from "node:fs";

const [upstreamPath, targetPath] = process.argv.slice(2);
if (!upstreamPath || !targetPath) {
  console.error("usage: node backfill-providers.mjs <upstream> <target>");
  process.exit(1);
}

const upstreamSrc = readFileSync(upstreamPath, "utf8");
const targetSrc = readFileSync(targetPath, "utf8");

// Build id -> { provider, provider_name } map from upstream by walking lines.
const upMap = new Map();
let curId = null;
for (const line of upstreamSrc.split("\n")) {
  const im = /^\s*"id":\s*"([^"]+)"/.exec(line);
  if (im) {
    curId = im[1];
    if (!upMap.has(curId)) upMap.set(curId, { provider: null, provider_name: null });
  }
  const pm = /^\s*"provider":\s*"([^"]*)"/.exec(line);
  if (pm && curId) upMap.get(curId).provider = pm[1];
  const pnm = /^\s*"provider_name":\s*"([^"]*)"/.exec(line);
  if (pnm && curId) upMap.get(curId).provider_name = pnm[1];
}

// Walk target. After every `"id"` line that is not already immediately
// followed by a `"provider"` line, insert provider fields if the id exists
// upstream (with a provider value).
const lines = targetSrc.split("\n");
const out = [];
let patched = 0;
let seenIds = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  out.push(line);

  const idMatch = /^\s*"id":\s*"([^"]+)"\s*,?\s*$/.exec(line);
  if (!idMatch) continue;

  const id = idMatch[1];
  seenIds++;

  const info = upMap.get(id);
  if (!info || info.provider === null) continue; // not in upstream -> leave untagged

  const next = lines[i + 1];
  if (/^\s*"provider":/.test(next)) continue; // already tagged (idempotent)

  const indentMatch = /(\s*)"id":/.exec(line);
  const indent = indentMatch ? indentMatch[1] : "    ";
  out.push(`${indent}"provider": "${info.provider}",`);
  out.push(`${indent}"provider_name": "${info.provider_name}",`);
  patched++;
}

const unmatched = seenIds - patched;

writeFileSync(targetPath, out.join("\n"), "utf8");
console.log(`patched: ${patched}`);
console.log(`unmatched: ${unmatched}`);
