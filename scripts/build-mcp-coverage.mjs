// Writes mcp/COVERAGE.md from mcp/studios.json and, when present, the live mcp/smoke-results.json.
// A dry-run report (mcp/smoke-results.dry-run.json) is never read here.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { renderCoverage } from '../packages/studio-mcp-core/src/coverage.js';
import { brand } from '../mcp/brand.js';
import { customTools } from '../mcp/tools.js';

const root = new URL('../mcp/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('studios.json', root), 'utf8'));
const resultsPath = new URL('smoke-results.json', root);
const report = existsSync(resultsPath) ? JSON.parse(readFileSync(resultsPath, 'utf8')) : null;
if (report?.dryRun) console.warn('smoke-results.json is a dry run; ignoring it.');

let md = renderCoverage({ manifest, report, customToolNames: new Set(customTools.map((t) => t.name)), brandName: brand.name });
// Feature-level view: every feature of every studio is either mapped to tools or explained. Offline checks only; "not run" until a live run covers it.
const bridge = JSON.parse(readFileSync(new URL('bridge-tools.json', root), 'utf8'));
const cell = (f) => (f.notExposed ? `not exposed: ${String(f.notExposed).replace(/\|/g, '/')}` : [...(f.tools || []).map((t) => `\`${t}\``), ...(f.bridgeTools || []).map((t) => `\`${t}\` (open tab)`)].join(', '));
md += `\n## Features\n\n| Studio | Feature | Tools |\n|---|---|---|\n${Object.entries(manifest.features || {}).flatMap(([studio, list]) => list.map((f) => `| \`${studio}\` | ${f.name} | ${cell(f)} |`)).join('\n')}\n\n"(open tab)" tools only work while that studio is open in a signed-in tab with "Let MCP control this tab" switched on. They are listed in \`mcp/bridge-tools.json\` (${Object.values(bridge.studios).reduce((n, s) => n + s.tools.length, 0)} tools). Live: not run.\n`;
writeFileSync(new URL('COVERAGE.md', root), md);
console.log(`mcp/COVERAGE.md: ${Object.keys(manifest.supported).length} supported, ${Object.keys(manifest.unsupported).length} not exposed${report && !report.dryRun ? ', live results from ' + report.generatedAt : ', no live results'}`);
