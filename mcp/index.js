#!/usr/bin/env node
// SmartVideo GO MCP server (stdio). Usage: SMARTVIDEO_GO_API_KEY=... node mcp/index.js
import { readFileSync } from 'node:fs';
import { runStdio } from '../packages/studio-mcp-core/src/index.js';
import { brand, endpointFixes } from './brand.js';
import { customTools } from './tools.js';

const catalogEntries = JSON.parse(readFileSync(new URL('./catalog.json', import.meta.url), 'utf8'));
await runStdio({ brand: { ...brand, customTools }, catalogEntries, endpointFixes });
