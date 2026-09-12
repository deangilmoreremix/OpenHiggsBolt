import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const GENERATED_DIR = path.join(process.cwd(), 'src', 'generated');
const OUTPUT_FILE = path.join(GENERATED_DIR, 'build-info.json');

function git(args) {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8', cwd: process.cwd() }).trim();
  } catch {
    return null;
  }
}

function getCommit() {
  return process.env.COMMIT_REF || git('rev-parse HEAD');
}

function getBranch() {
  return process.env.BRANCH || git('rev-parse --abbrev-ref HEAD');
}

function getContext() {
  return process.env.CONTEXT || 'local';
}

function getDeployId() {
  return process.env.DEPLOY_ID || null;
}

function getBuildId() {
  return process.env.BUILD_ID || null;
}

function getDeployUrl() {
  return process.env.DEPLOY_URL || null;
}

function safeString(value) {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

const metadata = {
  commit: safeString(getCommit()),
  branch: safeString(getBranch()),
  context: safeString(getContext()),
  deployId: safeString(getDeployId()),
  buildId: safeString(getBuildId()),
  deployUrl: safeString(getDeployUrl())
};

fs.mkdirSync(GENERATED_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(metadata, null, 2)}\n`);

console.log(`Generated build metadata: ${OUTPUT_FILE}`);
console.log(JSON.stringify(metadata, null, 2));
